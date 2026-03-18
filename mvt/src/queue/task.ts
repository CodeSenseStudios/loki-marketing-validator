import { randomUUID } from 'node:crypto';
import type { ModelTier, Task, TaskPriority } from '../types.ts';
import { nowIso } from '../utils/time.ts';

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1
};

export interface CreateTaskInput extends Partial<Task> {
  type: string;
  swarm: string;
  phase: number;
  model_tier: ModelTier;
  title: string;
  description: string;
}

export function makeTask(input: CreateTaskInput): Task {
  const created = nowIso();
  return {
    id: input.id ?? `task-${randomUUID()}`,
    type: input.type,
    swarm: input.swarm,
    phase: input.phase,
    priority: input.priority ?? 'normal',
    status: input.status ?? 'pending',
    assigned_agent: input.assigned_agent ?? null,
    model_tier: input.model_tier,
    title: input.title,
    description: input.description,
    inputs: input.inputs ?? [],
    expected_outputs: input.expected_outputs ?? [],
    acceptance_criteria: input.acceptance_criteria ?? [],
    depends_on: input.depends_on ?? [],
    blocks: input.blocks ?? [],
    retry_count: input.retry_count ?? 0,
    max_retries: input.max_retries ?? 3,
    created_at: input.created_at ?? created,
    started_at: input.started_at ?? null,
    completed_at: input.completed_at ?? null,
    error_log: input.error_log ?? [],
    tokens_used: input.tokens_used ?? 0,
    cost_usd: input.cost_usd ?? 0,
    metadata: input.metadata ?? {}
  };
}
