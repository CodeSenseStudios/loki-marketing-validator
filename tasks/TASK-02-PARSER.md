# TASK-02: Gap-Hunter Output Parser

## Context
The MVT system receives output from Gap-Hunter: a scored opportunity report, a PRD, financial models, and competitor analysis. This task builds the parser that extracts the marketing-relevant information and creates the experiment brief that all downstream agents consume.

## Model Assignment
- **This task**: Any model (deterministic code)
- **Runtime parser**: Orchestrator model (Sonnet) — interprets and summarizes

## Dependencies
- TASK-01 (directory structure exists)

## Deliverables

### 1. Parser module: `src/parser/gap-hunter-parser.ts`

TypeScript module that reads from `.mvt/input/` and produces a structured `ExperimentBrief`:

```typescript
interface ExperimentBrief {
  // From opportunity.json
  opportunity_name: string;
  opportunity_score: number;
  target_industries: string[];
  target_audience: {
    persona: string;
    pain_points: string[];
    current_solutions: string[];
    willingness_to_pay_range: { min: number; max: number };
  };

  // From prd.md
  product_name: string;
  one_liner: string;          // Single sentence value prop
  key_features: string[];     // Top 3-5 features
  differentiators: string[];  // vs competitors

  // From financials.json
  target_mrr: number;
  target_price_point: number;
  cac_budget: number;
  payback_months: number;

  // From competitors.json
  competitors: Array<{
    name: string;
    positioning: string;
    pricing: string;
    weaknesses: string[];
  }>;

  // Derived
  experiment_hypothesis: string;  // "We believe [audience] will sign up for [product] because [reason]"
  success_criteria: {
    min_signups: number;
    max_cac: number;
    min_conversion_rate: number;
    experiment_duration_days: number;
  };
}
```

### 2. Parser logic

The parser should:
1. Read each input file, validate it exists and has expected structure
2. Extract the fields above (some require AI summarization — call the orchestrator model to extract `one_liner`, `pain_points`, etc. from the PRD markdown)
3. Generate the `experiment_hypothesis` using the template above
4. Calculate `success_criteria` from the financial model (if target_mrr = $3000 and price = $30, we need 100 customers; if experiment should capture 10% of that = 10 signups minimum)
5. Write the result to `.mvt/output/experiment-brief.json`
6. Write a human-readable version to `.mvt/EXPERIMENT.md`

### 3. Fallback handling

If Gap-Hunter output is incomplete:
- Missing financials → use defaults from config.yaml
- Missing competitors → set empty array, flag for manual research
- Missing PRD → FATAL — cannot proceed without product definition

### 4. Validation

Write a schema validator that checks the ExperimentBrief has all required fields before allowing the pipeline to proceed.

## Acceptance Criteria
- [ ] Parser reads all 4 Gap-Hunter output files
- [ ] AI summarization calls use the orchestrator model (Sonnet)
- [ ] `experiment-brief.json` is written with all fields populated
- [ ] `EXPERIMENT.md` is human-readable with clear hypothesis and success criteria
- [ ] Missing file handling works correctly (fatal for PRD, graceful for others)
- [ ] Schema validation rejects incomplete briefs
