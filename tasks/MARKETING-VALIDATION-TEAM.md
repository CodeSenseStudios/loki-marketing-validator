# Marketing Validation Team — System Design & Task Plan

> **Purpose**: Build an autonomous AI marketing team that takes a Gap-Hunter opportunity output and validates market demand *before* writing a single line of product code. The system deploys a waitlist page, defines branding, prepares a sales funnel, designs an ads strategy, and proves customer interest exists.

---

## 1. OBJECTIVE — What We're Building

Gap-Hunter produces a scored opportunity with a PRD, financial model, and competitor analysis. But that's all desk research. **None of it proves a real human will pay money.**

This Marketing Validation Team (MVT) sits between Gap-Hunter's output and Loki Mode's product builder. Its job is simple:

**Prove demand or kill the idea — with real humans, real waitlist signups, real ad spend data.**

The system will:

1. **Define the brand** — name, color palette, voice, philosophy, positioning statement. Not vague; concrete brand assets a designer can implement.
2. **Deploy a waitlist landing page** — built, live, with analytics tracking, email capture, and a thank-you page with a referral loop.
3. **Prepare the sales funnel** — map the full journey from ad click → landing page → email signup → nurture sequence → intent signal → "ready to build."
4. **Prepare the ads strategy** — targeting, budget allocation, creative briefs, platform selection (Meta, Google, Reddit, LinkedIn), A/B test plan.
5. **Run the experiment** — execute for a defined experimental period (default: 14 days), measure cost-per-signup, conversion rates, and willingness-to-pay signals.
6. **Produce a Go/No-Go verdict** — a structured scorecard the human (you) uses to decide whether to hand the PRD to Loki Mode for real development.

---

## 2. UNDERSTANDING THE TWO REPOSITORIES

### 2.1 Loki Mode (`asklokesh/loki-mode`)

**What it is**: A multi-agent autonomous framework that takes a PRD and executes through a full lifecycle — research, architecture, development, testing, deployment, marketing, growth. It orchestrates 41 agent types across 7 swarms.

**What we're taking from it** (infrastructure, not product features):

| Component | How We Use It |
|-----------|---------------|
| **RARV Cycle** (Reason → Act → Reflect → Verify) | Every agent in MVT follows this loop. If verification fails, the agent captures the error in `CONTINUITY.md`, learns, and retries. This is the core quality mechanism. |
| **File-based task queue** (`.loki/queue/`) | We use the same `pending/`, `in-progress/`, `completed/`, `dead-letter/` structure for agent coordination. Tasks are JSON files with IDs, dependencies, assigned agent, status. |
| **3-tier memory system** | Episodic (what happened), Semantic (what we learned), Procedural (how to do things). Each agent writes to and reads from `.mvt/memory/`. |
| **Multi-provider support** | Orchestrator runs on Claude Opus/Sonnet. Grunt work agents run on Haiku or GPT-4o-mini. This is how we control token cost. |
| **State directory structure** (`.loki/`) | We replicate as `.mvt/` — state files, agent status, continuity logs, metrics. |
| **Dashboard** | Optional. Reuse loki-mode's FastAPI dashboard to monitor MVT progress. |
| **Swarm architecture** | We define our own swarms (see Section 4) but use the same spawn-on-demand pattern. |
| **Completion Council** | 3-agent vote on whether the experiment is complete and the Go/No-Go scorecard is ready. |

**What we're NOT taking**: Engineering swarm, DevOps agents, QA agents, code review pipeline. This is a marketing system, not a software builder.

### 2.2 Agency-Agents (`msitarzewski/agency-agents`)

**What it is**: A library of 120+ specialized AI agent personality prompts organized by division (Engineering, Design, Marketing, Sales, Paid Media, etc.). Each agent is a markdown file with: identity, core capabilities, workflows, deliverables, and success metrics.

**What we're taking from it** (agent personalities and workflows):

| Agent | From Division | Role in MVT |
|-------|--------------|-------------|
| **Brand Guardian** | Design | Defines brand identity, color palette, voice, visual guidelines. Produces `BRAND.md`. |
| **Growth Hacker** | Marketing | Designs the experiment: viral loops, referral mechanics, conversion funnel. |
| **Content Creator** | Marketing | Writes landing page copy, email sequences, social posts. |
| **SEO Specialist** | Marketing | On-page SEO for the waitlist page. Meta tags, schema markup, keyword targeting. |
| **LinkedIn Content Creator** | Marketing | LinkedIn-specific content for B2B opportunities. |
| **Reddit Community Builder** | Marketing | Authentic Reddit engagement strategy for community validation. |
| **PPC Campaign Strategist** | Paid Media | Google/Meta ads account structure, bidding strategy, budget allocation. |
| **Ad Creative Strategist** | Paid Media | Ad copy, creative briefs, A/B test variants. |
| **Paid Social Strategist** | Paid Media | Meta/LinkedIn/TikTok targeting, audience strategy. |
| **Tracking & Measurement** | Paid Media | GTM setup, conversion tracking, attribution. |
| **Outbound Strategist** | Sales | Cold outreach sequences for early validation (email, LinkedIn DM). |
| **Discovery Coach** | Sales | Interview scripts for potential customers. |
| **Analytics Reporter** | Support | Dashboard, KPI tracking, experiment analysis. |
| **UI Designer** | Design | Waitlist page visual design and component spec. |
| **UX Researcher** | Design | Survey design, user interview synthesis. |
| **Agents Orchestrator** | Specialized | Multi-agent coordination (adapted for MVT). |

**What we're adapting**: Each agency-agents prompt is a standalone personality. We wrap each one inside Loki Mode's RARV cycle so it doesn't just "suggest" — it executes, reflects, verifies, and learns.

---

## 3. HOW THE TWO REPOSITORIES MIX

The marriage works like this:

```
AGENCY-AGENTS provides the WHAT (agent brains, domain expertise, workflows)
LOKI-MODE provides the HOW (orchestration, task queue, RARV cycle, memory, multi-provider)
```

Concretely:

1. **Agent definition files** live in `.mvt/agents/`. Each file is an agency-agents markdown prompt, wrapped in a RARV-aware header that tells the agent to follow the Reason → Act → Reflect → Verify loop and write to `.mvt/memory/`.

2. **Swarm definitions** live in `.mvt/swarms/`. Each swarm groups agents logically and defines dependencies. The orchestrator reads swarm definitions to know what to spawn.

3. **Task queue** uses Loki Mode's flat-file pattern. The orchestrator (running on a smart model) creates tasks, assigns them to agents (running on cheaper models), and monitors completion.

4. **Model routing** follows this rule:

| Role | Model | Why |
|------|-------|-----|
| Orchestrator (`orch-planner`, `orch-judge`) | Claude Opus 4 / Sonnet 4 | Strategic decisions, task decomposition, Go/No-Go judgment |
| Brand & Strategy agents | Claude Sonnet 4 | Creative + analytical balance |
| Content writing agents | Claude Haiku 4 / GPT-4o-mini | High-volume text generation |
| Data/analytics agents | Claude Haiku 4 | Structured output, template filling |
| Ad copy variants | GPT-4o-mini | Cheap bulk generation of A/B variants |

5. **Experiment lifecycle** maps to Loki Mode's phases:

| Loki Phase | MVT Equivalent |
|------------|---------------|
| 0. Bootstrap | Create `.mvt/` directory, parse Gap-Hunter output |
| 1. Discovery | Brand definition, audience research, competitor positioning |
| 2. Architecture | Funnel architecture, tracking plan, page wireframe |
| 3. Infrastructure | Deploy waitlist page, set up analytics, configure ads accounts |
| 4. Development | Write copy, create email sequences, build ad creatives |
| 5. QA | Review all assets against brand guidelines, check tracking |
| 6. Deployment | Launch ads, publish page, start outreach |
| 7. Business | Run experiment, collect data, analyze results |
| 8. Growth | Optimize based on early data, iterate |
| 9. Judgment | Completion Council produces Go/No-Go scorecard |

---

## 4. MVT SWARM ARCHITECTURE

### Swarm 1: Brand & Identity (3 agents — Sonnet)

- `brand-guardian` — Produces `BRAND.md` with name, colors, typography, voice, positioning
- `ui-designer` — Waitlist page mockup spec, component design tokens
- `ux-researcher` — Target persona profiles, survey question bank

### Swarm 2: Funnel & Content (4 agents — Haiku/mini)

- `growth-hacker` — Funnel architecture, referral loop design, experiment hypothesis
- `content-creator` — Landing page copy, email sequences, social posts
- `seo-specialist` — On-page SEO, meta tags, schema markup
- `linkedin-creator` — LinkedIn-specific posts (if B2B)

### Swarm 3: Paid Acquisition (4 agents — Sonnet for strategy, Haiku for copy)

- `ppc-strategist` — Campaign structure, budget allocation, bidding strategy
- `ad-creative-strategist` — Ad copy variants, creative briefs, A/B plan
- `paid-social-strategist` — Platform selection, audience targeting, placement strategy
- `tracking-specialist` — GTM container, conversion events, attribution model

### Swarm 4: Outbound & Validation (3 agents — Sonnet for strategy, Haiku for messages)

- `outbound-strategist` — Cold email/DM sequences, ICP targeting
- `discovery-coach` — Customer interview scripts, validation question bank
- `reddit-builder` — Reddit engagement plan, authentic community posts

### Swarm 5: Analytics & Judgment (3 agents — Opus for judgment, Haiku for data)

- `analytics-reporter` — KPI dashboard spec, daily data aggregation
- `orch-judge` — Go/No-Go scorecard, devil's advocate challenge
- `orch-planner` — Task decomposition, dependency management, agent spawning

---

## 5. STEP-BY-STEP TASK FILES

What follows are the individual task files you hand to an AI coding agent (Claude Code, Cursor, etc.) to build the system. Each file is self-contained with context, acceptance criteria, and model routing.

---

### Task 01 — Bootstrap: Directory Structure & Configuration

**File**: `TASK-01-BOOTSTRAP.md`

---

### Task 02 — Gap-Hunter Output Parser

**File**: `TASK-02-PARSER.md`

---

### Task 03 — Agent Definition Templates

**File**: `TASK-03-AGENTS.md`

---

### Task 04 — RARV Cycle Engine

**File**: `TASK-04-RARV.md`

---

### Task 05 — Task Queue System

**File**: `TASK-05-QUEUE.md`

---

### Task 06 — Model Router (Smart/Cheap Split)

**File**: `TASK-06-MODEL-ROUTER.md`

---

### Task 07 — Brand Swarm Pipeline

**File**: `TASK-07-BRAND.md`

---

### Task 08 — Waitlist Page Builder

**File**: `TASK-08-WAITLIST.md`

---

### Task 09 — Funnel & Content Pipeline

**File**: `TASK-09-FUNNEL.md`

---

### Task 10 — Paid Acquisition Pipeline

**File**: `TASK-10-ADS.md`

---

### Task 11 — Outbound & Validation Pipeline

**File**: `TASK-11-OUTBOUND.md`

---

### Task 12 — Analytics & Experiment Runner

**File**: `TASK-12-ANALYTICS.md`

---

### Task 13 — Completion Council & Go/No-Go

**File**: `TASK-13-JUDGMENT.md`

---

### Task 14 — Orchestrator & Main Entry Point

**File**: `TASK-14-ORCHESTRATOR.md`

---

(Each task file is provided separately below.)
