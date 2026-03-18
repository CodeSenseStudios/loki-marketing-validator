# TASK-06: Model Router (Smart/Cheap Split)

## Context
The key cost optimization: orchestration and strategy use expensive smart models, grunt work uses cheap fast models. This task builds the routing layer.

## Model Assignment
- **This task**: Any model (systems code)
- **Runtime**: The router is called by every other module

## Dependencies
- TASK-01 (config with model assignments)

## Deliverables

### 1. Router: `src/router/model-router.ts`

```typescript
interface ModelCall {
  system_prompt: string;
  user_prompt: string;
  model_tier: string;       // From agent definition or explicit override
  max_tokens?: number;
  temperature?: number;
  response_format?: 'text' | 'json';
}

interface ModelResponse {
  content: string;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
}

class ModelRouter {
  // Resolve tier to actual model string
  resolveModel(tier: string): { provider: string; model: string };

  // Make a call through the appropriate provider
  async call(request: ModelCall): Promise<ModelResponse>;

  // Batch calls (for bulk copy generation)
  async batchCall(requests: ModelCall[]): Promise<ModelResponse[]>;

  // Get running cost totals
  getCostSummary(): { total_usd: number; by_tier: Record<string, number>; by_agent: Record<string, number> };
}
```

### 2. Tier-to-model mapping

Read from `config.yaml`. Default mapping:

| Tier | Provider | Model | Approx. Cost per 1M tokens (in/out) |
|------|----------|-------|--------------------------------------|
| `orchestrator` | Anthropic | claude-sonnet-4-20250514 | $3/$15 |
| `strategy` | Anthropic | claude-sonnet-4-20250514 | $3/$15 |
| `content` | Anthropic | claude-haiku-4-5-20251001 | $0.80/$4 |
| `data` | Anthropic | claude-haiku-4-5-20251001 | $0.80/$4 |
| `bulk_copy` | OpenAI | gpt-4o-mini | $0.15/$0.60 |
| `judgment` | Anthropic | claude-sonnet-4-20250514 | $3/$15 |

### 3. Provider adapters

Implement adapters for:
- **Anthropic** (`src/router/providers/anthropic.ts`): Uses the Messages API. Handles rate limits with exponential backoff.
- **OpenAI** (`src/router/providers/openai.ts`): Uses the Chat Completions API. Handles rate limits.

Each adapter:
- Accepts system + user prompt
- Returns standardized ModelResponse
- Tracks tokens and computes cost
- Retries on 429/500 with backoff

### 4. Cost guardrails

- **Soft limit**: When total spend reaches `token_budget_warn_pct` of `token_budget_hard_limit_usd`, log a warning and notify the orchestrator.
- **Hard limit**: When total spend reaches `token_budget_hard_limit_usd`, refuse all non-judgment calls. Only the `orch-judge` can still run (to produce the verdict with whatever data exists).
- **Per-call limit**: Reject any single call that would cost > $2 (misconfigured prompt guard).

### 5. Logging

Every call is logged to `.mvt/metrics/model-calls.jsonl`:
```json
{
  "timestamp": "2026-03-17T10:30:00Z",
  "agent_type": "content-creator",
  "task_id": "task-042",
  "tier": "content",
  "model": "claude-haiku-4-5-20251001",
  "input_tokens": 1200,
  "output_tokens": 450,
  "cost_usd": 0.0028,
  "latency_ms": 1340
}
```

## Acceptance Criteria
- [ ] Router resolves all 6 tiers to correct provider/model
- [ ] Anthropic adapter makes successful API calls
- [ ] OpenAI adapter makes successful API calls (or gracefully skips if no key)
- [ ] Rate limit retry with backoff works
- [ ] Soft limit warning fires at configured percentage
- [ ] Hard limit blocks non-judgment calls
- [ ] Per-call guard rejects expensive prompts
- [ ] All calls logged to JSONL
- [ ] `getCostSummary()` returns accurate running totals
