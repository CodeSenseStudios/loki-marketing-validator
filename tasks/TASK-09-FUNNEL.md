# TASK-09: Funnel & Content Pipeline

## Context
This pipeline produces all the written content: landing page copy, email nurture sequences, social media posts, and the funnel architecture that ties it all together.

## Model Assignment
- **growth-hacker** (funnel architecture): Strategy tier (Sonnet)
- **content-creator** (all copy): Content tier (Haiku)
- **seo-specialist** (SEO spec): Content tier (Haiku)
- **linkedin-creator** (LinkedIn posts): Bulk copy tier (GPT-4o-mini)

## Dependencies
- TASK-07 (brand identity — voice, positioning, personas)
- TASK-02 (experiment brief — product details, audience)

## Deliverables

### 1. Growth Hacker — Funnel Architecture

**`.mvt/output/funnel/architecture.md`** containing:

- **Funnel map**: Visual text diagram of the full journey
  ```
  [Ad/Post] → [Landing Page] → [Email Signup] → [Welcome Email]
  → [Value Email D+2] → [Social Proof Email D+5] → [Urgency Email D+10]
  → [Survey Email D+12] → [Intent Signal Captured]
  ```
- **Referral loop**: How signups generate more signups (share → friend signs up → original moves up waitlist)
- **Experiment hypothesis**: Specific, measurable. "We expect X% of landing page visitors to sign up, at a CAC of $Y, within Z days."
- **Metrics per stage**: traffic → page views → signups → email opens → clicks → survey completions
- **Kill criteria**: At what point do we stop the experiment early? (e.g., CAC > 3x target after 100 clicks)

### 2. Content Creator — Landing Page Copy

**`.mvt/output/funnel/copy/landing-page.md`** containing:

- **Headlines**: 3 variants (for A/B testing)
- **Subheadline**: 1 line expanding on the headline
- **Value props**: 3 benefits, each as headline + 1-sentence description
- **CTA text**: Primary ("Join the Waitlist") + 2 variants
- **Social proof text**: Template for "Join X others waiting for [product]"
- **Trust signals**: 3 short phrases ("No credit card required", etc.)
- **Footer text**: Brief product description

All copy must align with BRAND.md voice guidelines.

### 3. Content Creator — Email Sequence

**`.mvt/output/funnel/copy/emails/`** containing individual files:

1. `welcome.md` — Sent immediately after signup. Confirms spot, sets expectations.
2. `value-prop.md` — Day 2. Deep dive on the core problem and how product solves it.
3. `social-proof.md` — Day 5. "X people have joined" + testimonial placeholder.
4. `behind-scenes.md` — Day 8. Founder story, why building this (authenticity play).
5. `urgency.md` — Day 10. "We're closing the waitlist soon" or "Limited early access."
6. `survey.md` — Day 12. 3-question survey: biggest pain point, current solution, willing to pay $X?

Each email file includes:
- Subject line (2 variants for A/B)
- Preview text
- Body (plain text + basic HTML)
- CTA
- Unsubscribe notice

### 4. SEO Specialist — On-Page SEO

**`.mvt/output/waitlist/seo-spec.md`** containing:

- Title tag (< 60 chars)
- Meta description (< 155 chars)
- OG title, OG description, OG image dimensions
- Twitter card type and tags
- Target keyword + 3-5 secondary keywords
- Schema.org markup (JSON-LD for SoftwareApplication)
- Canonical URL guidance
- H1/H2 structure recommendation

### 5. LinkedIn Creator — Social Posts

**`.mvt/output/funnel/social/linkedin/`** containing 5 post files:

1. `launch-announcement.md` — "I'm building X because Y"
2. `problem-agitation.md` — Pain point post with engagement hook
3. `behind-the-scenes.md` — Process/journey post
4. `social-proof.md` — "X people signed up in Y days" (template for later)
5. `last-day.md` — Urgency close

Each post: 1300 chars max, hook in first 2 lines, CTA, 3-5 hashtags.

### 6. Pipeline orchestration: `src/pipelines/funnel.ts`

1. Growth-hacker runs first (funnel architecture)
2. Content-creator runs in parallel for landing page copy AND emails
3. SEO-specialist runs in parallel
4. LinkedIn-creator runs in parallel
5. All validate against BRAND.md voice guidelines (VERIFY step checks brand alignment)

## Acceptance Criteria
- [ ] Funnel architecture has clear stage-by-stage metrics
- [ ] Landing page copy has 3 headline variants for A/B testing
- [ ] All 6 email templates are complete with subject lines and body
- [ ] Emails have a logical progression (welcome → value → proof → urgency → survey)
- [ ] SEO spec covers all required meta tags
- [ ] LinkedIn posts are under 1300 chars each
- [ ] All copy aligns with BRAND.md voice (verified by RARV cycle)
- [ ] Kill criteria are specific and measurable
