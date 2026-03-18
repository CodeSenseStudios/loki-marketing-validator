# TASK-11: Outbound & Validation Pipeline

## Context
Paid ads test whether strangers will click and sign up. Outbound tests whether your specific ICP cares enough to respond. This pipeline produces cold outreach sequences, interview scripts, and a Reddit engagement plan — all designed to generate qualitative validation signals alongside the quantitative ad data.

## Model Assignment
- **outbound-strategist**: Strategy tier (Sonnet) — sequence design, ICP targeting
- **discovery-coach**: Strategy tier (Sonnet) — interview methodology
- **reddit-builder**: Content tier (Haiku) — post drafting

## Dependencies
- TASK-07 (brand identity, personas)
- TASK-09 (funnel architecture — need the waitlist URL and value prop)

## Deliverables

### 1. Outbound Strategist — Cold Sequences

**`.mvt/output/outbound/sequences/cold-email.md`**:

3-email sequence, spaced 3 days apart:

- **Email 1 (Problem)**: Lead with the pain point. No pitch. Ask if they experience it. < 80 words.
- **Email 2 (Solution tease)**: Reference the problem. Mention you're building something. Ask for 15 min of their time. Include waitlist link as a PS.
- **Email 3 (Direct ask)**: Short follow-up. "Did this land in spam or just not relevant?" Binary question to force a response.

Each email: subject line (2 variants), body, CTA.

**`.mvt/output/outbound/sequences/linkedin-dm.md`**:

3-message sequence:

- **Message 1 (Connection request note)**: Mention shared context (industry, mutual connections, content they posted). < 300 chars.
- **Message 2 (Value-first)**: Share a relevant insight or resource. No ask. Build credibility.
- **Message 3 (Soft ask)**: "I'm exploring [problem space] — would love 15 min of your perspective." Link to waitlist as optional.

**`.mvt/output/outbound/targeting.md`**:

- ICP company criteria: industry, size, tech stack signals, funding stage
- ICP person criteria: titles, seniority, department
- Where to find them: LinkedIn Sales Navigator filters, community directories, conference attendee lists
- Volume targets: 50 emails + 50 LinkedIn DMs during experiment period
- Expected response rate benchmarks: 5-10% reply rate for cold email, 15-25% acceptance for LinkedIn

### 2. Discovery Coach — Interview Scripts

**`.mvt/output/outbound/interview-script.md`**:

A complete 15-minute customer discovery script:

```
INTRO (2 min)
- Thank them, set expectations, ask permission to take notes
- "I'm researching [problem space], not selling anything"

SCREENING (1 min)
- "What's your role and what does a typical day look like?"
- (Confirm they match ICP persona)

PROBLEM EXPLORATION (5 min)
- "When was the last time you dealt with [problem]?"
- "Walk me through what happened"
- "What did you try? What worked/didn't?"
- "How often does this come up?"
- "On a scale of 1-10, how painful is this?"

CURRENT SOLUTION (3 min)
- "What do you use today to handle this?"
- "What do you pay for it?"
- "What's missing or frustrating about it?"

SOLUTION REACTION (3 min)
- Brief pitch of the concept (30 seconds max)
- "Does that resonate? What would you change?"
- "Would you use this? Would you pay for it?"
- "What would make this a no-brainer for you?"

CLOSE (1 min)
- "Can I add you to early access list?"
- "Anyone else who might find this relevant?"
```

**`.mvt/output/outbound/signal-scoring.md`**:

Scoring rubric for each interview:

| Signal | Score | Indicator |
|--------|-------|-----------|
| Strong intent | 5 | "I'd pay for this today" / "When can I start?" |
| High interest | 4 | "This sounds useful" + specific use case described |
| Mild interest | 3 | "Interesting" but no specific use case |
| Polite deflection | 2 | "Maybe" / "Send me more info" |
| No fit | 1 | Problem doesn't resonate / already solved |

Go signal: Average score ≥ 3.5 across 5+ interviews.

### 3. Reddit Builder — Community Engagement Plan

**`.mvt/output/outbound/reddit-plan.md`**:

- **Subreddit list**: 5-10 relevant subreddits, with subscriber count, posting rules, and relevance score
- **Engagement strategy**: Comment on existing threads before posting. Minimum 5 value-add comments before any self-promotion.
- **Post drafts**: 3 authentic posts (NOT promotional):
  1. "Question" post — "How do you handle [problem]? Currently doing X and it's painful"
  2. "Show HN"-style post — "I'm building [product] because [reason]. Looking for feedback"
  3. "Resource" post — Share a genuinely useful insight related to the problem space
- **Rules of engagement**:
  - Never use marketing language
  - Disclose affiliation if asked
  - Respond to every comment
  - Upvote/engage with other people's content first
  - Track which subreddits drive actual signups (via UTM)

### 4. Pipeline orchestration: `src/pipelines/outbound.ts`

1. outbound-strategist and discovery-coach run in parallel (independent)
2. reddit-builder runs in parallel
3. All validate against brand voice and persona definitions
4. Final check: cold email copy doesn't sound like marketing (run through a "spam score" prompt)

## Acceptance Criteria
- [ ] Cold email sequence has 3 emails, each under 80 words for email 1
- [ ] LinkedIn DM sequence respects platform character limits
- [ ] Targeting doc has specific, actionable ICP criteria
- [ ] Interview script covers all 5 sections in 15 minutes
- [ ] Signal scoring rubric has clear numeric thresholds
- [ ] Reddit plan has real subreddit names (validated via search)
- [ ] Reddit posts sound authentic, not promotional
- [ ] All outreach aligns with brand voice but is more casual/personal
- [ ] Volume targets are specified (50 emails, 50 DMs, 5+ interviews)
