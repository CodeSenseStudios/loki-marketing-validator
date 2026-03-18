import fs from 'node:fs/promises';
import path from 'node:path';
import type { Task, TaskStatus } from '../types.ts';
import { updateStatusFile } from '../state/status.ts';
import { ensureDir, fileExists, readJsonFile, writeJsonFile } from '../utils/fs.ts';
import { STATE_ROOT } from '../utils/paths.ts';
import { nowIso } from '../utils/time.ts';
import { makeTask, PRIORITY_ORDER, type CreateTaskInput } from './task.ts';

const BUCKET_MAP: Record<TaskStatus | 'dead-letter', string> = {
  pending: 'pending',
  'in-progress': 'in-progress',
  completed: 'completed',
  failed: 'dead-letter',
  'dead-letter': 'dead-letter'
};

const LOCK_DIR = path.join(STATE_ROOT, 'queue', '.locks');

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const task = makeTask(input);
  await ensureDir(bucketDir('pending'));
  await writeJsonFile(taskPath('pending', task.id), task);
  await updateStatusFile('QUEUE');
  return task;
}

export async function claimTask(agentType: string): Promise<Task | null> {
  await ensureDir(LOCK_DIR);
  const release = await acquireLock(agentType);
  try {
    const tasks = await listBucketTasks('pending');
    const eligible: Task[] = [];
    for (const task of tasks) {
      const dependencyStatus = await getDependencyStatus(task.id);
      if (task.type !== agentType && task.assigned_agent !== agentType) {
        continue;
      }
      if (!dependencyStatus.ready) {
        continue;
      }
      eligible.push(task);
    }
    eligible.sort(
      (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority] || a.created_at.localeCompare(b.created_at)
    );
    const task = eligible[0];
    if (!task) {
      return null;
    }
    task.status = 'in-progress';
    task.assigned_agent = agentType;
    task.started_at = nowIso();
    await moveTask(task, 'pending', 'in-progress');
    await updateStatusFile(`CLAIMED:${agentType}`, [agentType]);
    return task;
  } finally {
    await release();
  }
}

export async function completeTask(taskId: string, outputs: string[] = []): Promise<void> {
  const task = await getTaskStatus(taskId);
  task.status = 'completed';
  task.completed_at = nowIso();
  task.expected_outputs = Array.from(new Set([...task.expected_outputs, ...outputs]));
  await moveTask(task, 'in-progress', 'completed');
  await updateStatusFile('COMPLETED');
}

export async function failTask(taskId: string, error: string): Promise<void> {
  const task = await getTaskStatus(taskId);
  task.error_log.push(`${nowIso()} ${error}`);
  task.retry_count += 1;
  task.assigned_agent = null;
  task.started_at = null;

  if (task.retry_count >= task.max_retries) {
    task.status = 'failed';
    await moveTask(task, 'in-progress', 'dead-letter');
  } else {
    task.status = 'pending';
    await moveTask(task, 'in-progress', 'pending');
  }
  await updateStatusFile('FAILED');
}

export async function getTaskStatus(taskId: string): Promise<Task> {
  for (const bucket of ['pending', 'in-progress', 'completed', 'dead-letter'] as const) {
    const candidate = taskPath(bucket, taskId);
    if (await fileExists(candidate)) {
      return readJsonFile<Task>(candidate);
    }
  }
  throw new Error(`Task not found: ${taskId}`);
}

export async function listTasks(status?: string): Promise<Task[]> {
  if (status) {
    return listBucketTasks(normalizeBucket(status));
  }
  const tasks = await Promise.all(
    ['pending', 'in-progress', 'completed', 'dead-letter'].map((bucket) => listBucketTasks(bucket))
  );
  return tasks.flat();
}

export async function getDependencyStatus(taskId: string): Promise<{ ready: boolean; blocking: string[] }> {
  const task = await getTaskStatus(taskId);
  const blocking: string[] = [];
  for (const dependency of task.depends_on) {
    try {
      const dependencyTask = await getTaskStatus(dependency);
      if (dependencyTask.status !== 'completed') {
        blocking.push(dependency);
      }
    } catch {
      blocking.push(dependency);
    }
  }
  return { ready: blocking.length === 0, blocking };
}

export async function listBucketTasks(bucket: string): Promise<Task[]> {
  const dir = bucketDir(bucket);
  await ensureDir(dir);
  const entries = await fs.readdir(dir);
  const tasks: Task[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.json')) {
      continue;
    }
    tasks.push(await readJsonFile<Task>(path.join(dir, entry)));
  }
  return tasks;
}

export async function claimSpecificTask(taskId: string): Promise<Task> {
  const task = await getTaskStatus(taskId);
  task.status = 'in-progress';
  task.started_at = nowIso();
  await moveTask(task, 'pending', 'in-progress');
  await updateStatusFile(`CLAIMED:${task.assigned_agent ?? task.type}`, [task.assigned_agent ?? task.type]);
  return task;
}

export async function releaseStaleLocks(maxAgeMs = 5 * 60 * 1000): Promise<string[]> {
  await ensureDir(LOCK_DIR);
  const entries = await fs.readdir(LOCK_DIR);
  const cleared: string[] = [];
  for (const entry of entries) {
    const lockPath = path.join(LOCK_DIR, entry);
    const stat = await fs.stat(lockPath);
    if (Date.now() - stat.mtimeMs > maxAgeMs) {
      await fs.rm(lockPath, { force: true });
      cleared.push(entry);
    }
  }
  return cleared;
}

async function moveTask(task: Task, fromBucket: string, toBucket: string): Promise<void> {
  const fromPath = taskPath(fromBucket, task.id);
  const toPath = taskPath(toBucket, task.id);
  await ensureDir(bucketDir(toBucket));
  if (await fileExists(fromPath)) {
    await fs.rm(fromPath, { force: true });
  }
  await writeJsonFile(toPath, task);
}

function bucketDir(bucket: string): string {
  return path.join(STATE_ROOT, 'queue', normalizeBucket(bucket));
}

function taskPath(bucket: string, taskId: string): string {
  return path.join(bucketDir(bucket), `${taskId}.json`);
}

function normalizeBucket(value: string): string {
  return BUCKET_MAP[value as keyof typeof BUCKET_MAP] ?? value;
}

async function acquireLock(agentType: string): Promise<() => Promise<void>> {
  const lockPath = path.join(LOCK_DIR, `${agentType}.lock`);
  await releaseStaleLocks();
  if (await fileExists(lockPath)) {
    throw new Error(`Queue lock is already held for ${agentType}`);
  }
  await writeJsonFile(lockPath, { pid: process.pid, acquired_at: nowIso() });
  return async () => {
    await fs.rm(lockPath, { force: true });
  };
}

