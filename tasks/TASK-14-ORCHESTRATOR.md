# TASK-14: Orchestrator & Main Entry Point

## Context
The orchestrator is the brain. It reads the experiment brief, decomposes work into tasks, assigns them to agents via the queue, monitors progress through phases, handles failures, and drives the pipeline to completion. This is the `orch-planner` agent from loki-mode, adapted for marketing validation.

## Model Assignment
- **Orchestrator**: Orchestrator tier (Sonnet) — all planning and coordination decisions
- **Status updates**: Deterministic code (no model needed)

## Dependencies
- ALL other tasks (this wires everything together)

## Deliverables

### 1. Main Entry Point: `src/main.ts`

```bash
# Usage
npx mvt run /path/to/gap-hunter-output

# Or with options
npx mvt run /path/to/gap-hunter-output \
  --duration 14 \
  --budget 500 \
  --skip-ads \           # Run without paid acquisition (organic only)
  --dry-run              # Generate all assets but don't deploy
```

The entry point:
1. Calls bootstrap (TASK-01) — create `.mvt/` directory
2. Calls parser (TASK-02) — parse Gap-Hunter output into experiment brief
3. Loads config and validates environment
4. Starts the orchestrator loop

### 2. Orchestrator Loop: `src/orchestrator/planner.ts`

The orchestrator follows loki-mode's phase execution pattern:

```typescript
async function orchestrate(brief: ExperimentBrief): Promise<void> {
  // Phase 0: Bootstrap (already done by main.ts)

  // Phase 1: Brand & Identity
  await runSwarm('brand-identity', brief);

  // Phase 2: Parallel swarms (funnel + ads + outbound)
  await Promise.all([
    runSwarm('funnel-content', brief),
    runSwarm('paid-acquisition', brief),
    runSwarm('outbound-validation', brief),
  ]);

  // Phase 3: Build & Deploy
  await buildWaitlistPage();   // TASK-08 — depends on Phase 1 + 2 outputs

  // Phase 4: Pre-flight check
  await preflight();           // Validate all assets, tracking, links

  // Phase 5: Experiment (human-in-the-loop)
  await runExperiment();       // Daily analytics loop for N days

  // Phase 6: Judgment
  await runCouncil();          // Completion Council produces verdict
}
```

### 3. Swarm Runner: `src/orchestrator/swarm-runner.ts`

For each swarm:
1. Read swarm definition YAML
2. Check dependencies (all required swarms completed?)
3. Create tasks in queue for each agent in the swarm
4. Respect internal dependencies (e.g., ui-designer depends on brand-guardian)
5. Monitor task completion
6. Validate swarm completion criteria
7. Mark swarm as complete in state

### 4. Phase transitions

Between phases, the orchestrator:
1. Validates all expected outputs from the previous phase exist
2. Updates CONTINUITY.md with phase completion
3. Updates STATUS.txt
4. Checks budget — if over soft limit, warn; if over hard limit, skip to judgment

### 5. Human-in-the-loop gates

Certain actions require human intervention. The orchestrator pauses and writes instructions:

**Gate 1: Pre-deployment review** (after Phase 2)
```
.mvt/output/HUMAN-REVIEW-1.md:
"All brand assets, copy, and ad plans are ready.
Please review:
- .mvt/output/brand/BRAND.md
- .mvt/output/funnel/copy/landing-page.md
- .mvt/output/ads/google-plan.md
Run `npx mvt approve phase-2` to continue or `npx mvt edit` to request changes."
```

**Gate 2: Deployment approval** (after Phase 3)
```
.mvt/output/HUMAN-REVIEW-2.md:
"Waitlist page is built at .mvt/output/waitlist/site/
Please:
1. Review the page locally (open index.html)
2. Deploy using instructions in .mvt/output/waitlist/DEPLOY.md
3. Configure email collection backend
4. Set up ad accounts and upload creatives
5. Run `npx mvt launch` when ready to start the experiment clock"
```

**Gate 3: Daily data drops** (during Phase 5)
```
Each day, drop CSV exports in .mvt/input/data/
Run `npx mvt report` to generate daily analytics.
The system will flag early kill/success conditions.
```

### 6. CLI Commands: `src/cli.ts`

| Command | Description |
|---------|-------------|
| `npx mvt run <path>` | Start full pipeline |
| `npx mvt status` | Show current phase, active agents, task queue |
| `npx mvt approve <gate>` | Approve a human-in-the-loop gate |
| `npx mvt report` | Generate today's analytics report |
| `npx mvt launch` | Start experiment clock |
| `npx mvt kill` | Early-kill the experiment, jump to judgment |
| `npx mvt verdict` | Run Completion Council now |
| `npx mvt cost` | Show token spend breakdown |
| `npx mvt resume` | Resume from last checkpoint after interruption |

### 7. Error recovery

- **Agent failure**: RARV cycle retries. After max retries, task goes to dead-letter, orchestrator logs and continues with available data.
- **API rate limit**: Exponential backoff (from model router). Orchestrator detects slow progress and adjusts parallelism.
- **Human abandonment**: If no data drops for 3+ days during experiment, the system generates an "experiment stalled" warning and offers to run judgment on available data.
- **Crash recovery**: State is in flat files. `npx mvt resume` reads state and continues from last completed phase/task.

### 8. Project structure

```
marketing-validation-team/
├── package.json
├── tsconfig.json
├── .env.example
├── scripts/
│   ├── init.sh
│   ├── deploy-vercel.sh
│   └── deploy-github-pages.sh
├── src/
│   ├── main.ts                    # Entry point
│   ├── cli.ts                     # CLI command handler
│   ├── orchestrator/
│   │   ├── planner.ts             # Main orchestration loop
│   │   └── swarm-runner.ts        # Swarm execution
│   ├── parser/
│   │   └── gap-hunter-parser.ts   # TASK-02
│   ├── engine/
│   │   └── rarv.ts                # TASK-04
│   ├── queue/
│   │   ├── task.ts                # TASK-05
│   │   ├── queue.ts
│   │   └── watcher.ts
│   ├── router/
│   │   ├── model-router.ts        # TASK-06
│   │   └── providers/
│   │       ├── anthropic.ts
│   │       └── openai.ts
│   ├── pipelines/
│   │   ├── brand.ts               # TASK-07
│   │   ├── funnel.ts              # TASK-09
│   │   ├── ads.ts                 # TASK-10
│   │   └── outbound.ts            # TASK-11
│   ├── builders/
│   │   └── waitlist-page.ts       # TASK-08
│   ├── analytics/
│   │   ├── collector.ts           # TASK-12
│   │   ├── reporter.ts
│   │   ├── experiment-runner.ts
│   │   └── cumulative.ts
│   └── judgment/
│       ├── council.ts             # TASK-13
│       └── scorecard.ts
└── templates/
    ├── waitlist/                   # HTML/CSS/JS templates
    ├── emails/                     # Email HTML templates
    └── reports/                    # Report markdown templates
```

## Acceptance Criteria
- [ ] `npx mvt run /path` executes the full pipeline through Phase 2
- [ ] Human gates pause execution and write clear instruction files
- [ ] `npx mvt approve` resumes from the gate
- [ ] `npx mvt status` shows accurate phase/task/agent counts
- [ ] `npx mvt report` generates daily analytics
- [ ] `npx mvt cost` shows accurate token spend
- [ ] `npx mvt resume` recovers from interruption
- [ ] Phase transitions validate previous phase outputs
- [ ] Budget guardrails trigger at configured thresholds
- [ ] Error recovery handles dead agents without crashing the pipeline
- [ ] All CLI commands have `--help` output
