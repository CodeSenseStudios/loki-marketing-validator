# TASK-10: Paid Acquisition Pipeline

## Context
This pipeline prepares everything needed to run paid ads: campaign structures, targeting, creatives, budgets, and tracking. It does NOT execute the ads (that requires human approval and ad platform access).

## Model Assignment
- **ppc-strategist**: Strategy tier (Sonnet) — campaign architecture
- **ad-creative-strategist**: Bulk copy tier (GPT-4o-mini) — high volume variant generation
- **paid-social-strategist**: Strategy tier (Sonnet) — platform selection and targeting
- **tracking-specialist**: Data tier (Haiku) — tracking specs

## Dependencies
- TASK-07 (brand identity)
- TASK-09 (funnel architecture, landing page copy for message consistency)

## Deliverables

### 1. PPC Strategist — Google Ads Plan

**`.mvt/output/ads/google-plan.md`**:

- **Campaign structure**: Search campaign + Display remarketing
- **Ad groups**: 3-5 ad groups by theme/intent (problem-aware, solution-aware, competitor)
- **Keywords per group**: 10-15 keywords each, with match types
- **Negative keywords**: Initial negative keyword list
- **Bidding strategy**: Manual CPC for testing phase → target CPA after data
- **Daily budget**: Split recommendation (e.g., 60% search, 40% display)
- **Landing page URL params**: UTM template for each campaign/group

### 2. Paid Social Strategist — Social Ads Plan

**`.mvt/output/ads/social-plan.md`**:

- **Platform selection matrix**: Score each platform (Meta, LinkedIn, Reddit, TikTok) on: audience fit, cost, targeting precision, minimum spend
- **Recommended platforms**: Top 2 for this specific opportunity
- **Audience targeting per platform**:
  - Meta: interests, behaviors, lookalike seed description
  - LinkedIn: job titles, company sizes, industries, seniority
  - Reddit: subreddit targeting list
- **Placement strategy**: Feed vs. Stories vs. Sidebar
- **Budget allocation**: Percentage split across platforms
- **Creative format requirements**: Image sizes, video specs, character limits per platform

### 3. Ad Creative Strategist — Ad Copy Variants

**`.mvt/output/ads/creatives/`**:

- `google-rsa.md` — 15 headlines (30 chars each) + 4 descriptions (90 chars each) for Responsive Search Ads. Grouped by theme (benefit, urgency, social proof, question).
- `meta-ads.md` — 5 primary text variants + 5 headline variants + 3 description variants. Short-form and long-form primary text options.
- `linkedin-ads.md` — 3 sponsored content variants (intro text + headline + description). Professional tone per BRAND.md.
- `ab-test-matrix.md` — Which combinations to test first, expected sample size per variant, when to declare a winner.

### 4. Tracking Specialist — Measurement Plan

**`.mvt/output/ads/tracking-plan.md`**:

- **GTM container spec**: Tags, triggers, variables needed
- **GA4 events**:
  - `page_view` (all pages)
  - `waitlist_signup` (form submission — the primary conversion)
  - `referral_share` (share button click)
  - `email_capture` (redundant with signup, for cross-platform attribution)
- **Platform conversion events**:
  - Meta Pixel: PageView, Lead (on signup)
  - Google Ads: Conversion action for signup
  - LinkedIn Insight Tag: conversion for signup
- **UTM parameter schema**:
  ```
  utm_source: google|meta|linkedin|reddit|organic
  utm_medium: cpc|social|email|referral
  utm_campaign: {experiment-name}-{platform}-{audience}
  utm_content: {creative-variant-id}
  utm_term: {keyword} (search only)
  ```
- **Attribution model**: Last-click for simplicity during experiment
- **Data collection**: Where does data land? (GA4 + raw webhook logs)

### 5. Pipeline orchestration: `src/pipelines/ads.ts`

1. paid-social-strategist runs first (platform selection informs everything else)
2. ppc-strategist runs in parallel (Google is always a channel)
3. ad-creative-strategist runs after both (needs platform specs for format constraints)
4. tracking-specialist runs in parallel with creatives (independent of copy)
5. Final validation: all platform specs match creative format requirements

## Acceptance Criteria
- [ ] Google Ads plan has complete campaign → ad group → keyword hierarchy
- [ ] Social plan has scored platform matrix with clear recommendations
- [ ] At least 15 Google RSA headlines and 5 Meta primary text variants
- [ ] All creatives respect platform character/format limits
- [ ] A/B test matrix specifies which variants to test and sample size needed
- [ ] Tracking plan covers GTM setup, GA4 events, and all platform pixels
- [ ] UTM schema is consistent across all platforms
- [ ] Budget allocation adds up to experiment total
- [ ] All outputs reference consistent brand voice from BRAND.md
