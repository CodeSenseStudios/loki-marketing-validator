# TASK-01: Bootstrap — Directory Structure & Configuration

## Context
You are building the Marketing Validation Team (MVT), an autonomous multi-agent system that validates SaaS opportunity demand before development. This task creates the foundational directory structure and configuration, modeled after loki-mode's `.loki/` pattern.

## Model Assignment
- **This task**: Any model (boilerplate)
- **Runtime**: N/A — this is scaffolding

## Dependencies
- None (first task)

## Deliverables

### 1. Create the `.mvt/` directory tree

```
.mvt/
├── config/
│   ├── config.yaml              # Main config (experiment duration, budget, model routing)
│   ├── providers.yaml           # API keys and model assignments per role
│   └── circuit-breakers.yaml    # Failure thresholds per agent type
├── state/
│   ├── STATUS.txt               # Human-readable status (phase, active agents, task counts)
│   ├── orchestrator.json        # Current phase, experiment start/end times
│   └── agents/                  # Per-agent state files (spawned dynamically)
├── queue/
│   ├── pending/                 # Tasks waiting for assignment
│   ├── in-progress/             # Tasks currently being worked
│   ├── completed/               # Finished tasks
│   └── dead-letter/             # Failed tasks after max retries
├── memory/
│   ├── episodic/                # Event logs per agent per session
│   ├── semantic/                # Consolidated learnings
│   └── procedural/              # Reusable skill patterns
├── agents/                      # Agent definition markdown files
│   └── (populated by TASK-03)
├── swarms/                      # Swarm definition files
│   └── (populated by TASK-03)
├── input/                       # Gap-Hunter output (copied here on run)
│   ├── opportunity.json         # Scored opportunity
│   ├── prd.md                   # Build-ready PRD
│   ├── financials.json          # Financial model
│   └── competitors.json         # Competitor analysis
├── output/
│   ├── brand/                   # BRAND.md, color palette, logo brief
│   ├── waitlist/                # Built waitlist page files
│   ├── funnel/                  # Funnel architecture, email sequences
│   ├── ads/                     # Ad creatives, campaign structures
│   ├── outbound/                # Cold sequences, interview scripts
│   ├── analytics/               # KPI reports, daily snapshots
│   └── verdict/                 # Go/No-Go scorecard
├── logs/                        # Agent execution logs
├── metrics/                     # Token spend, cost tracking
├── CONTINUITY.md                # Running log: progress, mistakes, learnings
└── EXPERIMENT.md                # Experiment protocol: hypothesis, duration, success criteria
```

### 2. Create `config.yaml` with these defaults

```yaml
experiment:
  duration_days: 14
  budget_usd: 500
  min_signups_for_go: 100
  target_cac: 5.00
  hypothesis: ""  # Filled by orchestrator from Gap-Hunter input

models:
  orchestrator: "claude-sonnet-4-20250514"
  strategy: "claude-sonnet-4-20250514"
  content: "claude-haiku-4-5-20251001"
  data: "claude-haiku-4-5-20251001"
  bulk_copy: "gpt-4o-mini"
  judgment: "claude-sonnet-4-20250514"

providers:
  anthropic:
    api_key: "${ANTHROPIC_API_KEY}"
  openai:
    api_key: "${OPENAI_API_KEY}"

retry:
  max_retries: 5
  base_wait_seconds: 30
  max_wait_seconds: 300

tracking:
  token_budget_warn_pct: 80
  token_budget_hard_limit_usd: 50.00
```

### 3. Create `CONTINUITY.md` template

```markdown
# MVT Continuity Log

## Current Phase
BOOTSTRAP

## Active Experiment
- Opportunity: (pending)
- Hypothesis: (pending)
- Start: (pending)
- End: (pending)

## Progress
- [ ] Phase 0: Bootstrap
- [ ] Phase 1: Brand & Identity
- [ ] Phase 2: Funnel Architecture
- [ ] Phase 3: Asset Creation
- [ ] Phase 4: Deployment
- [ ] Phase 5: Experiment Running
- [ ] Phase 6: Judgment

## Mistakes & Learnings
(none yet)

## Next Action
Parse Gap-Hunter input and populate experiment config.
```

### 4. Create the initialization script

Write `scripts/init.sh` that:
- Creates all directories
- Copies config templates
- Validates environment variables (ANTHROPIC_API_KEY required, OPENAI_API_KEY optional)
- Accepts a Gap-Hunter output directory as argument and copies files to `.mvt/input/`

## Acceptance Criteria
- [ ] Running `./scripts/init.sh /path/to/gap-hunter-output` creates the full directory tree
- [ ] Config files are valid YAML
- [ ] Environment variable validation prints clear errors for missing keys
- [ ] CONTINUITY.md is created with the template
- [ ] Gap-Hunter files are copied to `.mvt/input/`
