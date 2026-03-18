# TASK-03: Agent Definition Templates

## Context
Each agent in MVT is defined by a markdown file that combines an agency-agents personality prompt with loki-mode's RARV execution wrapper. This task creates all 17 agent definitions and 5 swarm definitions.

## Model Assignment
- **This task**: Sonnet (creative writing + system design)
- **Runtime**: N/A — these are prompt templates

## Dependencies
- TASK-01 (directory structure)

## Deliverables

### 1. Agent definition format

Every file in `.mvt/agents/` follows this structure:

```markdown
---
name: [Agent Name]
type: [agent-type-slug]
swarm: [swarm-name]
model_tier: orchestrator | strategy | content | data | bulk_copy | judgment
tools: [list of tools this agent can use]
---

# [Agent Name]

## RARV Protocol
You operate within the RARV cycle. For every task:
1. **REASON**: Read `.mvt/CONTINUITY.md` and your task file. Understand context, prior mistakes, and dependencies.
2. **ACT**: Execute your task. Write outputs to the designated output directory.
3. **REFLECT**: Update `.mvt/CONTINUITY.md` with what you did, what worked, what didn't.
4. **VERIFY**: Check your output against the acceptance criteria in your task. If verification fails, log the error in "Mistakes & Learnings" and retry from REASON.

## Memory Protocol
- Write session events to `.mvt/memory/episodic/[your-type]-[timestamp].json`
- Read semantic memory from `.mvt/memory/semantic/` before starting
- If you discover a reusable pattern, write it to `.mvt/memory/procedural/`

## Identity
[Adapted from agency-agents personality — core capabilities, voice, approach]

## Core Mission
[Specific to MVT — what this agent does in the marketing validation context]

## Inputs
[What files/data this agent reads]

## Outputs
[What files/data this agent produces]

## Critical Rules
[Domain-specific rules that must never be violated]

## Success Metrics
[How to verify this agent's output is good enough]
```

### 2. Create these 17 agent files

**Swarm 1 — Brand & Identity** (`.mvt/agents/`)
1. `brand-guardian.md` — Based on `design/design-brand-guardian.md`. Mission: Read experiment brief, produce `BRAND.md` with product name validation, color palette (hex values), typography, voice guidelines, positioning statement, tagline options. Output: `.mvt/output/brand/BRAND.md`
2. `ui-designer.md` — Based on `design/design-ui-designer.md`. Mission: Read BRAND.md, produce waitlist page design spec with layout, component tokens, responsive breakpoints. Output: `.mvt/output/brand/page-spec.md`
3. `ux-researcher.md` — Based on `design/design-ux-researcher.md`. Mission: Read experiment brief, produce target persona cards, survey question bank, interview guide. Output: `.mvt/output/brand/personas.md`, `.mvt/output/outbound/interview-guide.md`

**Swarm 2 — Funnel & Content** (`.mvt/agents/`)
4. `growth-hacker.md` — Based on `marketing/marketing-growth-hacker.md`. Mission: Design the full funnel architecture (ad → landing → signup → email nurture → intent signal), referral loop mechanics, experiment hypothesis with specific metrics. Output: `.mvt/output/funnel/architecture.md`
5. `content-creator.md` — Based on `marketing/marketing-content-creator.md`. Mission: Write all copy — headline variants, subheadline, body text, CTA, email sequence (welcome, value prop, social proof, urgency, last chance). Output: `.mvt/output/funnel/copy/`
6. `seo-specialist.md` — Based on `marketing/marketing-seo-specialist.md`. Mission: On-page SEO checklist for waitlist page — title tag, meta description, OG tags, schema markup, keyword targets. Output: `.mvt/output/waitlist/seo-spec.md`
7. `linkedin-creator.md` — Based on `marketing/marketing-linkedin-content-creator.md`. Mission: 5 LinkedIn post drafts for launch announcement, behind-the-scenes, problem-agitation, social proof teaser, last-day urgency. Output: `.mvt/output/funnel/social/linkedin/`

**Swarm 3 — Paid Acquisition** (`.mvt/agents/`)
8. `ppc-strategist.md` — Based on `paid-media/paid-media-ppc-strategist.md`. Mission: Google Ads campaign structure (search + display), keyword groups, bidding strategy, daily budget split. Output: `.mvt/output/ads/google-plan.md`
9. `ad-creative-strategist.md` — Based on `paid-media/paid-media-creative-strategist.md`. Mission: 10+ ad copy variants (headlines, descriptions) for Google RSAs and Meta ads, A/B testing matrix. Output: `.mvt/output/ads/creatives/`
10. `paid-social-strategist.md` — Based on `paid-media/paid-media-paid-social-strategist.md`. Mission: Platform selection matrix, audience targeting specs (interests, lookalikes, retargeting), placement strategy, budget allocation across platforms. Output: `.mvt/output/ads/social-plan.md`
11. `tracking-specialist.md` — Based on `paid-media/paid-media-tracking-specialist.md`. Mission: GTM container spec, GA4 event definitions, conversion events for each platform, UTM parameter schema. Output: `.mvt/output/ads/tracking-plan.md`

**Swarm 4 — Outbound & Validation** (`.mvt/agents/`)
12. `outbound-strategist.md` — Based on `sales/sales-outbound-strategist.md`. Mission: Cold email sequence (3 emails), LinkedIn DM sequence (3 messages), ICP company/person targeting criteria. Output: `.mvt/output/outbound/sequences/`
13. `discovery-coach.md` — Based on `sales/sales-discovery-coach.md`. Mission: Customer discovery interview script (15 min), screening criteria, signal scoring rubric (strong interest / mild / no fit). Output: `.mvt/output/outbound/interview-script.md`
14. `reddit-builder.md` — Based on `marketing/marketing-reddit-community-builder.md`. Mission: Subreddit targeting list, 5 authentic post/comment drafts, engagement rules. Output: `.mvt/output/outbound/reddit-plan.md`

**Swarm 5 — Analytics & Judgment** (`.mvt/agents/`)
15. `analytics-reporter.md` — Based on `support/support-analytics-reporter.md`. Mission: Daily data aggregation (signups, CAC, conversion rate, traffic sources), KPI dashboard spec, experiment summary template. Output: `.mvt/output/analytics/`
16. `orch-judge.md` — Custom (loki-mode pattern). Mission: Review all experiment data, apply devil's advocate challenge, produce Go/No-Go scorecard. Model tier: judgment (Opus/Sonnet). Output: `.mvt/output/verdict/scorecard.md`
17. `orch-planner.md` — Custom (loki-mode pattern). Mission: Decompose phases into tasks, assign to agents, manage dependencies, monitor progress, handle failures. Model tier: orchestrator. Output: task files in `.mvt/queue/`

### 3. Create 5 swarm definition files in `.mvt/swarms/`

Each swarm file:
```yaml
name: brand-identity
phase: 1
agents:
  - brand-guardian
  - ui-designer
  - ux-researcher
dependencies: []  # Which swarms must complete first
parallel: true     # Can agents within this swarm run in parallel?
completion_criteria:
  - BRAND.md exists and has all required sections
  - page-spec.md exists
  - personas.md exists
```

Swarms:
1. `brand-identity.yaml` — phase 1, no dependencies
2. `funnel-content.yaml` — phase 2, depends on brand-identity
3. `paid-acquisition.yaml` — phase 2, depends on brand-identity (parallel with funnel)
4. `outbound-validation.yaml` — phase 2, depends on brand-identity (parallel with funnel)
5. `analytics-judgment.yaml` — phase 3, depends on all others

## Acceptance Criteria
- [ ] All 17 agent markdown files exist in `.mvt/agents/`
- [ ] Each agent file follows the RARV wrapper format
- [ ] Each agent references correct input/output paths
- [ ] Each agent has a `model_tier` frontmatter field
- [ ] All 5 swarm YAML files exist with correct dependency chains
- [ ] Swarm completion criteria are testable (file existence checks)
