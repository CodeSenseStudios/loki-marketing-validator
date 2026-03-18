# TASK-05: Task Queue System

## Context
Loki-mode uses a file-based task queue with JSON files in directory buckets. MVT replicates this pattern for simplicity and debuggability — any human can inspect `.mvt/queue/` to see what's happening.

## Model Assignment
- **This task**: Any model (deterministic systems code)
- **Runtime**: N/A — pure Node.js

## Dependencies
- TASK-01 (directory structure)

## Deliverables

### 1. Task schema: `src/queue/task.ts`

```typescript
interface Task {
  id: string;                    // e.g., "task-001-brand-guardian"
  type: string;                  // Agent type slug
  swarm: string;                 // Swarm name
  phase: number;                 // Pipeline phase (1-6)
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  assigned_agent: string | null;
  model_tier: string;

  // Content
  title: string;
  description: string;
  inputs: string[];              // Paths to input files
  expected_outputs: string[];    // Paths where outputs should be written
  acceptance_criteria: string[]; // List of criteria for VERIFY phase

  // Dependencies
  depends_on: string[];          // Task IDs that must complete first
  blocks: string[];              // Task IDs this blocks

  // Execution
  retry_count: number;
  max_retries: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_log: string[];

  // Cost
  tokens_used: number;
  cost_usd: number;
}
```

### 2. Queue operations: `src/queue/queue.ts`

Implement these operations:
- `createTask(task: Partial<Task>): Task` — write to `pending/`
- `claimTask(agent_type: string): Task | null` — find highest-priority pending task matching type, move to `in-progress/`
- `completeTask(task_id: string, outputs: string[]): void` — move to `completed/`
- `failTask(task_id: string, error: string): void` — increment retry, move back to `pending/` or to `dead-letter/`
- `getTaskStatus(task_id: string): Task` — find task in any bucket
- `listTasks(status?: string): Task[]` — list all tasks or filtered by status
- `getDependencyStatus(task_id: string): { ready: boolean; blocking: string[] }` — check if all dependencies are completed

### 3. Dependency resolution

Tasks with `depends_on` entries cannot be claimed until all dependencies are in `completed/`. The queue's `claimTask` checks this automatically.

### 4. File locking

Use simple `.lock` files to prevent two agents from claiming the same task. Lock with PID, auto-release after 5 minutes (stale lock protection).

### 5. Queue watcher: `src/queue/watcher.ts`

A polling loop (configurable interval, default 5s) that:
- Scans `pending/` for tasks with satisfied dependencies
- Reports queue depth to STATUS.txt
- Detects stuck tasks (in-progress > 10 minutes) and flags them
- Updates `.mvt/state/STATUS.txt` with current counts

## Acceptance Criteria
- [ ] Tasks are JSON files named `{task-id}.json` in the correct bucket directory
- [ ] `createTask` writes valid JSON to `pending/`
- [ ] `claimTask` respects dependencies (won't claim if deps not completed)
- [ ] `claimTask` uses file locking to prevent race conditions
- [ ] `failTask` moves to `dead-letter/` after max retries
- [ ] `listTasks` can enumerate all tasks across all buckets
- [ ] Queue watcher updates STATUS.txt every cycle
- [ ] Stale lock detection works (kill lock after 5 min)
