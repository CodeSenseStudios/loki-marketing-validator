# TASK-07: Brand Swarm Pipeline

## Context
This is the first creative pipeline to run. It takes the experiment brief and produces all brand assets that downstream agents need. Three agents work in sequence: brand-guardian → ui-designer → ux-researcher.

## Model Assignment
- **brand-guardian**: Strategy tier (Sonnet) — creative brand decisions
- **ui-designer**: Strategy tier (Sonnet) — visual system design
- **ux-researcher**: Content tier (Haiku) — persona structuring

## Dependencies
- TASK-02 (experiment brief exists)
- TASK-03 (agent definitions exist)
- TASK-04 (RARV engine)
- TASK-05 (task queue)
- TASK-06 (model router)

## Deliverables

### 1. Brand Guardian task definition

Create a task that instructs `brand-guardian` to read `.mvt/output/experiment-brief.json` and produce:

**`.mvt/output/brand/BRAND.md`** containing:
- **Product Name**: Validated name (check domain availability logic, trademark conflict flag)
- **Tagline**: 3 options, ranked
- **Positioning Statement**: "For [audience] who [need], [product] is a [category] that [benefit]. Unlike [competitors], we [differentiator]."
- **Brand Voice**: 5 adjectives, 3 "we say / we don't say" examples
- **Color Palette**: Primary, secondary, accent, background, text — all as hex values. Must pass WCAG AA contrast.
- **Typography**: Heading font + body font (from Google Fonts for web use)
- **Brand Philosophy**: 2-3 sentences on why this product should exist

### 2. UI Designer task definition

Depends on brand-guardian completion. Reads `BRAND.md` and produces:

**`.mvt/output/brand/page-spec.md`** containing:
- Waitlist page layout (single page): hero → value props → social proof placeholder → CTA → footer
- Design tokens: spacing scale, border radius, shadow values
- Component specs: email input, CTA button, headline, subheadline, trust badges
- Responsive breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- Animation notes: subtle entrance animations, CTA hover state

### 3. UX Researcher task definition

Can run in parallel with ui-designer. Reads experiment brief and produces:

**`.mvt/output/brand/personas.md`** containing:
- 2-3 target persona cards (name, role, pain points, goals, objections, channels)
- Jobs-to-be-done framework for each persona

**`.mvt/output/outbound/interview-guide.md`** containing:
- 15-minute customer discovery script
- Screening questions (is this person in our ICP?)
- Signal scoring rubric

### 4. Pipeline orchestration

Write `src/pipelines/brand.ts` that:
1. Creates the 3 tasks in the queue with correct dependencies
2. Monitors completion
3. Validates outputs exist and have required sections
4. Marks swarm as complete in state

## Acceptance Criteria
- [ ] `BRAND.md` contains all sections with concrete values (hex colors, not "a blue shade")
- [ ] Color palette passes WCAG AA contrast check (implement basic contrast ratio calculation)
- [ ] `page-spec.md` has enough detail for a frontend developer to build the page
- [ ] `personas.md` contains at least 2 persona cards
- [ ] `interview-guide.md` has a complete 15-min script
- [ ] Pipeline runs tasks in correct dependency order
- [ ] All outputs are validated before swarm is marked complete
