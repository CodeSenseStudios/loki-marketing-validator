import fs from 'node:fs/promises';
import path from 'node:path';
import { updateStatusFile } from '../state/status.ts';
import { STATE_ROOT } from '../utils/paths.ts';
import { listTasks, releaseStaleLocks } from './queue.ts';

export interface QueueWatcherResult {
  ready: number;
  stuck: string[];
  staleLocks: string[];
}

export async function runQueueWatcher(stuckMinutes = 10): Promise<QueueWatcherResult> {
  const tasks = await listTasks();
  const inProgress = tasks.filter((task) => task.status === 'in-progress');
  const stuck = inProgress
    .filter((task) => task.started_at && Date.now() - Date.parse(task.started_at) > stuckMinutes * 60 * 1000)
    .map((task) => task.id);

  const staleLocks = await releaseStaleLocks();
  await updateStatusFile('WATCHER', inProgress.map((task) => task.assigned_agent).filter(Boolean) as string[]);
  await fs.writeFile(
    path.join(STATE_ROOT, 'logs', 'watcher.json'),
    JSON.stringify({ ready: tasks.filter((task) => task.status === 'pending').length, stuck, staleLocks }, null, 2),
    'utf8'
  );

  return {
    ready: tasks.filter((task) => task.status === 'pending').length,
    stuck,
    staleLocks
  };
}
