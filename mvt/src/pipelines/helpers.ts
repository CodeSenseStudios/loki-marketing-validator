import path from 'node:path';
import type { CreateTaskInput } from '../queue/task.ts';
import { claimSpecificTask, completeTask, createTask } from '../queue/queue.ts';
import { RarvEngine } from '../engine/rarv.ts';
import { AGENT_EXECUTORS } from '../agents/executors.ts';
import { STATE_ROOT } from '../utils/paths.ts';

const engine = new RarvEngine(undefined, AGENT_EXECUTORS);

export async function runAgentTask(input: CreateTaskInput): Promise<void> {
  const task = await createTask(input);
  const claimed = await claimSpecificTask(task.id);
  const result = await engine.run({
    agent_type: input.type,
    task_id: claimed.id,
    task_file: path.join(STATE_ROOT, 'queue', 'in-progress', `${claimed.id}.json`),
    agent_definition: path.join(STATE_ROOT, 'agents', `${input.type}.md`),
    model_tier: input.model_tier,
    max_retries: input.max_retries ?? 3,
    continuity_path: path.join(STATE_ROOT, 'CONTINUITY.md')
  });
  if (result.status === 'completed') {
    await completeTask(claimed.id, result.outputs);
    return;
  }
  throw new Error(`Task ${task.id} ended with status ${result.status}.`);
}

export function stateOutput(...parts: string[]): string {
  return path.join(STATE_ROOT, 'output', ...parts);
}
