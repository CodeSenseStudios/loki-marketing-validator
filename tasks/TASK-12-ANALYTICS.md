# TASK-12: Analytics & Experiment Runner

## Context
Once the waitlist page is live and ads are running, data flows in. This task builds the analytics agent's daily reporting loop and the experiment runner that monitors progress against success criteria.

## Model Assignment
- **analytics-reporter**: Data tier (Haiku) — data aggregation and templating
- **experiment runner**: Orchestrator logic — deterministic code with model calls for interpretation

## Dependencies
- TASK-08 (waitlist page deployed with tracking)
- TASK-09 (funnel architecture with stage metrics)
- TASK-10 (tracking plan with event definitions)

## Deliverables

### 1. Data Collection Layer: `src/analytics/collector.ts`

Since this is a validation experiment (not a production system), data collection is simple:

**Input sources** (the human configures these connections):
- **Signup webhook log**: JSON file or Google Sheet with email, timestamp, UTM params, referral source, A/B variant
- **GA4 export**: Manual CSV export or API pull (if configured) — sessions, page views, events
- **Ad platform exports**: Manual CSV exports from Google Ads, Meta Ads — spend, impressions, clicks, CPC
- **Interview log**: Markdown file where the human logs interview scores

The collector reads from `.mvt/input/data/` where the human drops daily exports:
```
.mvt/input/data/
├── signups.csv          # email, timestamp, source, utm_*, variant, referral_code
├── ga4-daily.csv        # date, sessions, page_views, signup_events, sources
├── google-ads.csv       # date, campaign, impressions, clicks, spend
├── meta-ads.csv         # date, campaign, impressions, clicks, spend
└── interviews.json      # [{date, score, notes, would_pay, persona_match}]
```

### 2. Daily Report Generator: `src/analytics/reporter.ts`

Runs once per day (triggered manually or by cron). Reads all data files and produces:

**`.mvt/output/analytics/daily/day-{N}.md`**:

```markdown
# Experiment Day {N} — {date}

## Key Metrics
- Total signups: X (target: Y)
- Signups today: Z
- Conversion rate (visit → signup): X%
- Total ad spend: $X
- Cost per signup (CAC): $X (target: $Y)
- Referral signups: X (X% of total)

## Traffic Sources
| Source | Visits | Signups | Conv Rate | Cost | CAC |
|--------|--------|---------|-----------|------|-----|
| Google Ads | | | | | |
| Meta Ads | | | | | |
| LinkedIn | | | | | |
| Reddit | | | | | |
| Direct/Organic | | | | | |
| Referral | | | | | |

## A/B Test Status
| Variant | Visitors | Signups | Conv Rate | Confidence |
|---------|----------|---------|-----------|------------|
| Headline A | | | | |
| Headline B | | | | |
| Headline C | | | | |

## Email Sequence Performance
| Email | Sent | Opened | Open Rate | Clicked | CTR |
|-------|------|--------|-----------|---------|-----|
| Welcome | | | | | |
| Value Prop | | | | | |
(etc.)

## Interview Signals
- Interviews completed: X / 5 target
- Average signal score: X / 5
- Would pay: X / X interviewed

## Trend
- Signup velocity: accelerating / steady / declining
- CAC trend: improving / stable / worsening

## Flags
- (any kill criteria approaching threshold)
- (any data quality issues)
```

### 3. Experiment Runner: `src/analytics/experiment-runner.ts`

Logic that runs after each daily report:

```typescript
interface ExperimentStatus {
  day: number;
  total_days: number;
  signups: number;
  target_signups: number;
  cac: number;
  target_cac: number;
  budget_spent: number;
  budget_total: number;
  interview_score: number;
  status: 'running' | 'early_success' | 'early_kill' | 'completed';
  recommendation: string;
}
```

**Decision logic**:

1. **Early kill** (stop the experiment):
   - CAC > 3x target after 50+ clicks → "Demand signal too weak at this price point"
   - Conversion rate < 0.5% after 500+ visitors → "Landing page or offer not resonating"
   - Budget > 80% spent with < 20% of target signups → "Economics don't work"

2. **Early success** (could stop early):
   - Target signups reached before experiment ends → "Demand validated. Consider extending for more data."
   - CAC < 50% of target → "Strong demand signal. Opportunity may be underpriced."

3. **Running** (continue):
   - None of the above triggers hit → continue to next day

4. **Completed** (experiment period ended):
   - Hand off to Completion Council (TASK-13)

### 4. Cumulative Report: `src/analytics/cumulative.ts`

At experiment end, generate:

**`.mvt/output/analytics/experiment-summary.md`**:

- Full metrics table (day-by-day)
- Best performing channel
- Best performing ad creative
- A/B test winner (with statistical confidence)
- Email sequence performance
- Interview synthesis
- CAC vs target comparison
- Signup curve chart (ASCII art or data for visualization)

### 5. Data validation

Before generating reports, validate:
- CSV files have expected columns
- No duplicate signups (by email)
- Spend data matches across sources (within 10% tolerance)
- Dates are within experiment window

## Acceptance Criteria
- [ ] Collector reads all 5 data source types
- [ ] Daily report generates with all sections populated (zeros for missing data)
- [ ] Early kill triggers fire correctly (write unit tests for each condition)
- [ ] Early success triggers fire correctly
- [ ] Cumulative report synthesizes all daily data
- [ ] Data validation catches malformed CSVs
- [ ] Reports are written to dated files in `.mvt/output/analytics/daily/`
- [ ] ExperimentStatus JSON is updated in `.mvt/state/orchestrator.json`
- [ ] Missing data files produce warnings, not crashes
