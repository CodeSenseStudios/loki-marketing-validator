# TASK-04: RARV Cycle Engine

## Context
The RARV (Reason → Act → Reflect → Verify) cycle is the core execution loop from loki-mode. Every agent runs inside this loop. This task implements the engine that wraps any agent's execution in the cycle.

## Model Assignment
- **This task**: Any model (systems code)
- **Runtime**: The engine itself is deterministic; it calls AI models through the model router

## Dependencies
- TASK-01 (directory structure)
- TASK-06 (model router — can be developed in parallel, mock the interface)

## Deliverables

### 1. RARV Engine: `src/engine/rarv.ts`

```typescript
interface RARVConfig {
  agent_type: string;
  task_id: string;
  task_file: string;         // Path to task JSON in queue
  agent_definition: string;  // Path to agent markdown
  model_tier: string;        // From agent frontmatter
  max_retries: number;
  continuity_path: string;   // .mvt/CONTINUITY.md
}

interface RARVResult {
  status: 'completed' | 'failed' | 'retry';
  outputs: string[];          // Paths to files produced
  tokens_used: number;
  errors: string[];
  retry_count: number;
}
```

### 2. The four phases

**REASON phase**:
1. Read `CONTINUITY.md` — extract "Mistakes & Learnings" section
2. Read the agent's semantic memory (`.mvt/memory/semantic/[agent-type].json`)
3. Read the task file from queue — extract inputs, expected outputs, acceptance criteria
4. Build context prompt: agent definition + continuity context + task details + prior learnings
5. Call the model (via router) with: "Given this context, plan your approach. What will you do and why?"
6. Store the plan in the task's in-progress state

**ACT phase**:
1. Take the plan from REASON
2. Call the model with the agent definition as system prompt, the plan as context, and "Execute this plan. Produce the required outputs."
3. Write outputs to the designated paths
4. Log token usage to `.mvt/metrics/`

**REFLECT phase**:
1. Call the model with: "Review what you just produced. What went well? What could be improved? Any concerns?"
2. Append reflection to CONTINUITY.md under the agent's section
3. Write episodic memory entry to `.mvt/memory/episodic/`
4. If reflection identifies issues, flag them for VERIFY

**VERIFY phase**:
1. Check each acceptance criterion from the task file:
   - File existence checks (does the output file exist?)
   - Schema validation (does JSON match expected structure?)
   - Content checks (call model: "Does this output satisfy: [criterion]? Answer YES or NO with reason.")
2. If ALL pass → status = 'completed', move task to completed queue
3. If ANY fail:
   - Log failure details to "Mistakes & Learnings" in CONTINUITY.md
   - If retry_count < max_retries → status = 'retry', return to REASON
   - If retry_count >= max_retries → status = 'failed', move to dead-letter queue

### 3. Circuit breaker integration

Wrap the entire cycle in a circuit breaker:
- Track consecutive failures per agent type
- If failures > threshold (from config), stop spawning that agent type
- Cooldown period before retry
- Alert the orchestrator when a circuit opens

### 4. Token tracking

Every model call logs:
```json
{
  "timestamp": "ISO-8601",
  "agent_type": "brand-guardian",
  "task_id": "task-007",
  "phase": "ACT",
  "model": "claude-sonnet-4-20250514",
  "input_tokens": 2340,
  "output_tokens": 890,
  "cost_usd": 0.023
}
```

Write to `.mvt/metrics/token-log.jsonl` (append-only).

## Acceptance Criteria
- [ ] RARV engine accepts a config and runs all 4 phases in sequence
- [ ] REASON phase reads continuity and memory before planning
- [ ] ACT phase produces files at expected paths
- [ ] REFLECT phase updates CONTINUITY.md
- [ ] VERIFY phase checks acceptance criteria and handles pass/fail
- [ ] Retry loop works (fail → learn → retry from REASON)
- [ ] Circuit breaker opens after threshold failures
- [ ] Token usage is logged for every model call
- [ ] Dead-letter queue receives tasks that exceed max retries
