# TASK-13: Completion Council & Go/No-Go Scorecard

## Context
This is the final judgment layer, adapted from loki-mode's Completion Council pattern. Three "council members" independently evaluate the experiment data and vote on whether to proceed to product development. One member plays devil's advocate.

## Model Assignment
- **All council members**: Judgment tier (Sonnet) — this is the most important decision in the pipeline
- **Devil's advocate**: Same tier, adversarial prompt

## Dependencies
- TASK-12 (experiment summary and all analytics data)
- All other tasks (all outputs are reviewed)

## Deliverables

### 1. Council Architecture: `src/judgment/council.ts`

Three council members, each with a different lens:

**Member 1 — Market Advocate**
- Reads: experiment summary, signup data, interview signals, competitor analysis
- Evaluates: Is there real demand? Are people willing to pay? Is the market big enough?
- Bias: Optimistic — looks for reasons to proceed

**Member 2 — Financial Realist**  
- Reads: experiment summary, CAC data, financial model, ad performance
- Evaluates: Do the economics work? Can we acquire customers profitably? Is the CAC sustainable?
- Bias: Conservative — looks for unit economics viability

**Member 3 — Devil's Advocate**
- Reads: ALL outputs from ALL agents
- Evaluates: What could go wrong? What did we miss? Are we fooling ourselves?
- Bias: Skeptical — actively argues against proceeding
- Special rule: If Members 1 and 2 both vote GO, the Devil's Advocate gets a second round to challenge their reasoning (anti-sycophancy mechanism from loki-mode)

### 2. Voting Protocol

```
1. Each member independently writes a 500-word assessment
2. Each member casts a vote: GO / NO-GO / CONDITIONAL
3. If unanimous GO → Devil's Advocate challenges → Members can change votes
4. If unanimous NO-GO → Advocate gets to make final case → Members can change votes
5. Final tally determines recommendation
6. CONDITIONAL votes include specific conditions that must be met
```

Voting thresholds:
- **GO**: 2+ GO votes after challenge round → Proceed to Loki Mode
- **NO-GO**: 2+ NO-GO votes after challenge round → Kill the idea
- **CONDITIONAL**: Any CONDITIONAL votes → List conditions; human decides

### 3. Scorecard Generator: `src/judgment/scorecard.ts`

**`.mvt/output/verdict/scorecard.md`**:

```markdown
# Go/No-Go Scorecard

## Experiment: {product_name}
## Date: {date}
## Verdict: {GO | NO-GO | CONDITIONAL}

---

## Quantitative Scores

| Metric | Target | Actual | Pass? |
|--------|--------|--------|-------|
| Total signups | {target} | {actual} | ✅/❌ |
| Cost per signup (CAC) | < ${target} | ${actual} | ✅/❌ |
| Landing page conversion | > 3% | {actual}% | ✅/❌ |
| Email open rate | > 30% | {actual}% | ✅/❌ |
| Referral rate | > 10% | {actual}% | ✅/❌ |
| Interview signal score | > 3.5/5 | {actual} | ✅/❌ |
| Willingness to pay | > 50% | {actual}% | ✅/❌ |
| A/B test winner identified | Yes | {yes/no} | ✅/❌ |

**Quantitative Score: {X}/8 passed**

## Council Assessments

### Market Advocate
{500-word assessment}
**Vote: {GO/NO-GO/CONDITIONAL}**

### Financial Realist
{500-word assessment}
**Vote: {GO/NO-GO/CONDITIONAL}**

### Devil's Advocate
{500-word assessment}
**Vote: {GO/NO-GO/CONDITIONAL}**

## Challenge Round
{If triggered — Devil's Advocate challenge and member responses}

## Final Votes
- Market Advocate: {vote}
- Financial Realist: {vote}
- Devil's Advocate: {vote}

## Conditions (if CONDITIONAL)
{List of specific conditions}

## Recommendation
{GO: "Hand the PRD to Loki Mode for development. Key learnings to incorporate: [...]"}
{NO-GO: "Kill this opportunity. Reasons: [...]. Salvageable elements: [...]"}
{CONDITIONAL: "Proceed only if: [...]. Suggested next steps: [...]"}

## Learnings for Future Experiments
- What worked well in this validation
- What to change in the process
- Insights about the market/audience

## Handoff Package (if GO)
- PRD location: .mvt/input/prd.md
- Brand assets: .mvt/output/brand/
- Validated copy: .mvt/output/funnel/copy/ (use A/B winner)
- Target audience confirmed: .mvt/output/brand/personas.md
- Pricing signal: ${X}/mo based on interview data
- Waitlist emails for beta: .mvt/input/data/signups.csv
```

### 4. Anti-sycophancy measures

- Each council member runs in a SEPARATE model call with NO visibility into other members' assessments
- Devil's Advocate prompt explicitly instructs: "Your job is to find fatal flaws. If you can't find any, look harder. A surface-level 'looks good' is a failure of your role."
- If all three vote GO on first round, log a warning: "Unanimous agreement on first round — challenge round mandatory"
- Challenge round shows the Devil's Advocate all GO arguments and asks: "Given these arguments, what are they missing?"

### 5. Handoff to Loki Mode (if GO)

If verdict is GO, generate:

**`.mvt/output/verdict/loki-handoff.md`**:

A modified PRD that incorporates experiment learnings:
- Original PRD + amendments from validation data
- Confirmed pricing based on willingness-to-pay signals  
- Confirmed target audience (narrowed from persona research + signup demographics)
- Validated messaging (A/B test winner copy)
- List of waitlist emails for beta invites
- Brand assets for the product build

This file is what gets passed to `loki start` for product development.

## Acceptance Criteria
- [ ] Three council members produce independent 500-word assessments
- [ ] Each member runs in a separate model call (no cross-contamination)
- [ ] Devil's Advocate challenge round triggers on unanimous GO
- [ ] Scorecard has all quantitative metrics filled from experiment data
- [ ] Verdict is one of GO / NO-GO / CONDITIONAL
- [ ] CONDITIONAL verdict lists specific conditions
- [ ] GO verdict produces a loki-handoff.md ready for `loki start`
- [ ] Anti-sycophancy warning fires on unanimous first-round agreement
- [ ] Learnings section is populated regardless of verdict
