# EXECUTION ORDER — Build Sequence for the AI Developer

## How to Use These Task Files

Each `TASK-XX-*.md` file is self-contained. Hand one at a time to your AI coding agent (Claude Code, Cursor, Codex). The agent reads the file and builds what it describes.

**Do not hand all 14 at once.** Follow the dependency graph below.

---

## Dependency Graph

```
TASK-01 (Bootstrap)
   │
   ├── TASK-02 (Parser) ──────────────────────────┐
   │                                                │
   ├── TASK-05 (Queue) ───────────┐                │
   │                               │                │
   ├── TASK-06 (Model Router) ────┤                │
   │                               │                │
   └── TASK-04 (RARV Engine) ─────┘                │
          │                                         │
          │    ┌────────────────────────────────────┘
          │    │
   TASK-03 (Agent Definitions) ← needs TASK-01 only, but benefits from
          │                        understanding TASK-04's RARV wrapper format
          │
          ├── TASK-07 (Brand Swarm) ─────────────────────┐
          │                                               │
          │    ┌── TASK-09 (Funnel & Content) ◄──────────┤
          │    │                                          │
          │    ├── TASK-10 (Paid Acquisition) ◄──────────┤
          │    │                                          │
          │    └── TASK-11 (Outbound & Validation) ◄─────┘
          │              │
          │              │
          ├── TASK-08 (Waitlist Page Builder) ◄── TASK-07 + TASK-09
          │
          ├── TASK-12 (Analytics & Experiment) ◄── TASK-08 + TASK-10
          │
          ├── TASK-13 (Completion Council) ◄── TASK-12
          │
          └── TASK-14 (Orchestrator) ◄── ALL tasks (wires everything)
```

---

## Recommended Build Phases

### Phase A — Foundation (can be parallelized)
Build these 4 tasks simultaneously — they have no dependencies on each other:

| Task | What | Est. Effort |
|------|------|-------------|
| TASK-01 | Directory structure, config files, init script | Small |
| TASK-05 | Task queue (file-based, JSON tasks) | Medium |
| TASK-06 | Model router with Anthropic + OpenAI adapters | Medium |
| TASK-04 | RARV cycle engine | Medium |

**Verify**: Queue can create/claim/complete tasks. Router can make API calls. RARV engine runs a mock agent through all 4 phases.

### Phase B — Definitions
| Task | What | Est. Effort |
|------|------|-------------|
| TASK-02 | Gap-Hunter output parser | Medium |
| TASK-03 | All 17 agent definitions + 5 swarm definitions | Large (mostly writing) |

**Verify**: Parser produces a valid ExperimentBrief from sample Gap-Hunter output. Agent files follow the RARV wrapper format.

### Phase C — Pipelines (can be parallelized)
| Task | What | Est. Effort |
|------|------|-------------|
| TASK-07 | Brand swarm pipeline | Medium |
| TASK-09 | Funnel & content pipeline | Medium |
| TASK-10 | Paid acquisition pipeline | Medium |
| TASK-11 | Outbound & validation pipeline | Medium |

**Verify**: Each pipeline creates tasks in the queue, runs agents through RARV, and produces expected output files.

### Phase D — Builders
| Task | What | Est. Effort |
|------|------|-------------|
| TASK-08 | Waitlist page builder (HTML/CSS/JS generation) | Large |
| TASK-12 | Analytics collector + daily reporter + experiment runner | Large |

**Verify**: Page builder produces valid HTML from brand + copy inputs. Reporter generates a daily report from sample CSV data.

### Phase E — Judgment & Wiring
| Task | What | Est. Effort |
|------|------|-------------|
| TASK-13 | Completion Council with 3 independent members | Medium |
| TASK-14 | Orchestrator that wires everything + CLI | Large |

**Verify**: Council produces a Go/No-Go scorecard. CLI commands all work. Full pipeline runs end-to-end with mock data.

---

## Testing Strategy

### Unit Tests (per task)
- Queue operations (TASK-05)
- Model router cost calculations (TASK-06)
- RARV retry logic (TASK-04)
- Early kill/success triggers (TASK-12)
- Council voting logic (TASK-13)

### Integration Tests (per phase)
- Phase A: Queue + Router + RARV work together
- Phase C: Pipeline creates tasks → RARV runs agents → outputs appear
- Phase E: Full pipeline with mock model responses

### End-to-End Test
- Use `GAPHUNTER_MOCK_MODE=true` equivalent
- Mock model responses return template outputs
- Verify every output file is created
- Verify scorecard is generated
- Verify CLI commands work

---

## Token Budget Estimate

For a single experiment run (14-day validation):

| Component | Model | Est. Calls | Est. Tokens | Est. Cost |
|-----------|-------|-----------|-------------|-----------|
| Orchestrator planning | Sonnet | 20 | 100K | $1.50 |
| Brand swarm (3 agents) | Sonnet | 12 | 80K | $1.20 |
| Funnel content (4 agents) | Haiku | 20 | 120K | $0.50 |
| Ad copy variants | GPT-4o-mini | 15 | 60K | $0.05 |
| Ads strategy (2 agents) | Sonnet | 8 | 60K | $0.90 |
| Outbound (3 agents) | Mixed | 12 | 80K | $0.60 |
| Daily analytics (14 days) | Haiku | 14 | 40K | $0.16 |
| Completion Council | Sonnet | 6 | 50K | $0.75 |
| RARV retries (~20%) | Mixed | 20 | 100K | $1.00 |
| **Total** | | **~127** | **~690K** | **~$6.66** |

The smart/cheap split saves roughly 60-70% compared to running everything on Sonnet.
