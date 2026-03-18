import type { AgentDefinition, SwarmDefinition } from '../types.ts';

const identity = {
  brand: 'You are a brand strategist who turns opportunity inputs into concrete, implementation-ready brand systems.',
  design: 'You are a product design specialist who translates strategy into crisp, buildable interface specifications.',
  research: 'You are a UX researcher who turns sparse market context into practical personas and interview assets.',
  content: 'You are a conversion-focused marketer who writes practical, testable launch assets.',
  paid: 'You are a paid acquisition strategist who balances targeting precision, budget discipline, and test design.',
  sales: 'You are a validation-focused outreach strategist who optimizes for signal, not vanity metrics.',
  judgment: 'You are a skeptical evaluator who protects the user from false positive demand signals.',
  orchestration: 'You are a systems planner coordinating a multi-agent marketing validation pipeline.'
} as const;

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    name: 'Brand Guardian',
    type: 'brand-guardian',
    swarm: 'brand-identity',
    model_tier: 'strategy',
    tools: ['filesystem', 'brief-reader'],
    mission: 'Turn the experiment brief into a concrete web-ready brand system.',
    inputs: ['.mvt/output/experiment-brief.json'],
    outputs: ['.mvt/output/brand/BRAND.md'],
    criticalRules: ['Use concrete hex values.', 'Flag domain and trademark checks as manual review items.'],
    successMetrics: ['All required BRAND.md sections exist.', 'Palette maintains AA contrast for core text use.'],
    identity: identity.brand
  },
  {
    name: 'UI Designer',
    type: 'ui-designer',
    swarm: 'brand-identity',
    model_tier: 'strategy',
    tools: ['filesystem', 'brand-reader'],
    mission: 'Create a frontend-ready waitlist page specification.',
    inputs: ['.mvt/output/brand/BRAND.md'],
    outputs: ['.mvt/output/brand/page-spec.md'],
    criticalRules: ['Specify responsive behavior.', 'Include concrete design tokens.'],
    successMetrics: ['Layout is buildable without additional design decisions.'],
    identity: identity.design
  },
  {
    name: 'UX Researcher',
    type: 'ux-researcher',
    swarm: 'brand-identity',
    model_tier: 'content',
    tools: ['filesystem', 'brief-reader'],
    mission: 'Define the target personas and interview materials.',
    inputs: ['.mvt/output/experiment-brief.json'],
    outputs: ['.mvt/output/brand/personas.md', '.mvt/output/outbound/interview-guide.md'],
    criticalRules: ['Keep personas grounded in the brief.', 'Produce practical interview prompts.'],
    successMetrics: ['At least two persona cards exist.', 'Interview guide fits a 15-minute call.'],
    identity: identity.research
  },
  {
    name: 'Growth Hacker',
    type: 'growth-hacker',
    swarm: 'funnel-content',
    model_tier: 'strategy',
    tools: ['filesystem', 'brief-reader'],
    mission: 'Map the validation funnel and its kill/success signals.',
    inputs: ['.mvt/output/experiment-brief.json', '.mvt/output/brand/BRAND.md'],
    outputs: ['.mvt/output/funnel/architecture.md'],
    criticalRules: ['Use measurable stage metrics.', 'Include kill criteria.'],
    successMetrics: ['Funnel stages and thresholds are explicit.'],
    identity: identity.content
  },
  {
    name: 'Content Creator',
    type: 'content-creator',
    swarm: 'funnel-content',
    model_tier: 'content',
    tools: ['filesystem', 'brand-reader'],
    mission: 'Produce landing page and email sequence copy.',
    inputs: ['.mvt/output/brand/BRAND.md', '.mvt/output/funnel/architecture.md'],
    outputs: ['.mvt/output/funnel/copy/landing-page.md', '.mvt/output/funnel/copy/emails/'],
    criticalRules: ['Keep copy aligned with brand voice.', 'Provide testable headline and subject variants.'],
    successMetrics: ['Landing page and six email assets exist.'],
    identity: identity.content
  },
  {
    name: 'SEO Specialist',
    type: 'seo-specialist',
    swarm: 'funnel-content',
    model_tier: 'content',
    tools: ['filesystem'],
    mission: 'Create a complete on-page SEO specification for the waitlist page.',
    inputs: ['.mvt/output/brand/BRAND.md', '.mvt/output/funnel/copy/landing-page.md'],
    outputs: ['.mvt/output/waitlist/seo-spec.md'],
    criticalRules: ['Keep titles and descriptions within limits.', 'Provide JSON-LD guidance.'],
    successMetrics: ['All required tags and schema guidance are present.'],
    identity: identity.content
  },
  {
    name: 'LinkedIn Creator',
    type: 'linkedin-creator',
    swarm: 'funnel-content',
    model_tier: 'bulk_copy',
    tools: ['filesystem'],
    mission: 'Write five LinkedIn launch and validation posts.',
    inputs: ['.mvt/output/brand/BRAND.md', '.mvt/output/brand/personas.md'],
    outputs: ['.mvt/output/funnel/social/linkedin/'],
    criticalRules: ['Stay under platform limits.', 'Hook within the first two lines.'],
    successMetrics: ['Five channel-specific post files exist.'],
    identity: identity.content
  },
  {
    name: 'PPC Strategist',
    type: 'ppc-strategist',
    swarm: 'paid-acquisition',
    model_tier: 'strategy',
    tools: ['filesystem'],
    mission: 'Design the Google Ads account and keyword plan.',
    inputs: ['.mvt/output/funnel/architecture.md', '.mvt/output/funnel/copy/landing-page.md'],
    outputs: ['.mvt/output/ads/google-plan.md'],
    criticalRules: ['Use a clear campaign hierarchy.', 'Tie budgets to the experiment budget.'],
    successMetrics: ['Campaign, ad group, keyword, and budget sections exist.'],
    identity: identity.paid
  },
  {
    name: 'Ad Creative Strategist',
    type: 'ad-creative-strategist',
    swarm: 'paid-acquisition',
    model_tier: 'bulk_copy',
    tools: ['filesystem'],
    mission: 'Generate creative variants and an A/B testing matrix.',
    inputs: ['.mvt/output/ads/google-plan.md', '.mvt/output/ads/social-plan.md'],
    outputs: ['.mvt/output/ads/creatives/'],
    criticalRules: ['Respect channel limits.', 'Group variants by theme.'],
    successMetrics: ['All creative bundles and the matrix exist.'],
    identity: identity.paid
  },
  {
    name: 'Paid Social Strategist',
    type: 'paid-social-strategist',
    swarm: 'paid-acquisition',
    model_tier: 'strategy',
    tools: ['filesystem'],
    mission: 'Select channels and define paid social targeting.',
    inputs: ['.mvt/output/brand/personas.md', '.mvt/output/funnel/architecture.md'],
    outputs: ['.mvt/output/ads/social-plan.md'],
    criticalRules: ['Score platforms explicitly.', 'Recommend only the top two channels.'],
    successMetrics: ['Platform matrix and channel targeting sections exist.'],
    identity: identity.paid
  },
  {
    name: 'Tracking Specialist',
    type: 'tracking-specialist',
    swarm: 'paid-acquisition',
    model_tier: 'data',
    tools: ['filesystem'],
    mission: 'Define the tracking and attribution implementation plan.',
    inputs: ['.mvt/output/funnel/architecture.md'],
    outputs: ['.mvt/output/ads/tracking-plan.md'],
    criticalRules: ['Keep events consistent across platforms.', 'Use last-click attribution for simplicity.'],
    successMetrics: ['GTM, GA4, UTM, and conversion sections exist.'],
    identity: identity.paid
  },
  {
    name: 'Outbound Strategist',
    type: 'outbound-strategist',
    swarm: 'outbound-validation',
    model_tier: 'strategy',
    tools: ['filesystem'],
    mission: 'Create outbound sequences and ICP targeting.',
    inputs: ['.mvt/output/brand/personas.md', '.mvt/output/funnel/copy/landing-page.md'],
    outputs: ['.mvt/output/outbound/sequences/', '.mvt/output/outbound/targeting.md'],
    criticalRules: ['Optimize for signal, not hard selling.', 'Keep early touchpoints short.'],
    successMetrics: ['Cold email, LinkedIn DM, and targeting docs exist.'],
    identity: identity.sales
  },
  {
    name: 'Discovery Coach',
    type: 'discovery-coach',
    swarm: 'outbound-validation',
    model_tier: 'strategy',
    tools: ['filesystem'],
    mission: 'Produce a customer interview script and scoring rubric.',
    inputs: ['.mvt/output/brand/personas.md'],
    outputs: ['.mvt/output/outbound/interview-script.md', '.mvt/output/outbound/signal-scoring.md'],
    criticalRules: ['Keep interviews non-leading.', 'Define clear numeric scoring bands.'],
    successMetrics: ['Interview script and scoring rubric exist.'],
    identity: identity.sales
  },
  {
    name: 'Reddit Builder',
    type: 'reddit-builder',
    swarm: 'outbound-validation',
    model_tier: 'content',
    tools: ['filesystem'],
    mission: 'Create an authentic Reddit engagement plan.',
    inputs: ['.mvt/output/brand/personas.md', '.mvt/output/funnel/architecture.md'],
    outputs: ['.mvt/output/outbound/reddit-plan.md'],
    criticalRules: ['Avoid overt marketing language.', 'Flag live subreddit validation for manual review.'],
    successMetrics: ['Subreddit list, post drafts, and engagement rules exist.'],
    identity: identity.sales
  },
  {
    name: 'Analytics Reporter',
    type: 'analytics-reporter',
    swarm: 'analytics-judgment',
    model_tier: 'data',
    tools: ['filesystem'],
    mission: 'Aggregate daily metrics and summarize experiment performance.',
    inputs: ['.mvt/input/data/*'],
    outputs: ['.mvt/output/analytics/'],
    criticalRules: ['Handle missing data gracefully.', 'Surface data quality warnings explicitly.'],
    successMetrics: ['Daily and cumulative reports are generated.'],
    identity: identity.content
  },
  {
    name: 'Orch Judge',
    type: 'orch-judge',
    swarm: 'analytics-judgment',
    model_tier: 'judgment',
    tools: ['filesystem'],
    mission: 'Produce the final Go/No-Go scorecard and challenge weak evidence.',
    inputs: ['.mvt/output/analytics/experiment-summary.md'],
    outputs: ['.mvt/output/verdict/scorecard.md'],
    criticalRules: ['Challenge false confidence.', 'State conditional verdicts explicitly.'],
    successMetrics: ['Scorecard, verdict, and handoff package exist when appropriate.'],
    identity: identity.judgment
  },
  {
    name: 'Orch Planner',
    type: 'orch-planner',
    swarm: 'analytics-judgment',
    model_tier: 'orchestrator',
    tools: ['filesystem', 'queue'],
    mission: 'Plan the work, manage dependencies, and move the experiment through gates.',
    inputs: ['.mvt/output/experiment-brief.json'],
    outputs: ['.mvt/queue/'],
    criticalRules: ['Respect dependency ordering.', 'Pause at human gates.'],
    successMetrics: ['Phases advance cleanly and state stays resumable.'],
    identity: identity.orchestration
  }
];

export const SWARM_DEFINITIONS: SwarmDefinition[] = [
  {
    name: 'brand-identity',
    phase: 1,
    agents: ['brand-guardian', 'ui-designer', 'ux-researcher'],
    dependencies: [],
    parallel: true,
    completion_criteria: ['BRAND.md exists', 'page-spec.md exists', 'personas.md exists']
  },
  {
    name: 'funnel-content',
    phase: 2,
    agents: ['growth-hacker', 'content-creator', 'seo-specialist', 'linkedin-creator'],
    dependencies: ['brand-identity'],
    parallel: true,
    completion_criteria: ['architecture.md exists', 'landing-page.md exists', 'seo-spec.md exists']
  },
  {
    name: 'paid-acquisition',
    phase: 2,
    agents: ['paid-social-strategist', 'ppc-strategist', 'ad-creative-strategist', 'tracking-specialist'],
    dependencies: ['brand-identity'],
    parallel: true,
    completion_criteria: ['google-plan.md exists', 'social-plan.md exists', 'tracking-plan.md exists']
  },
  {
    name: 'outbound-validation',
    phase: 2,
    agents: ['outbound-strategist', 'discovery-coach', 'reddit-builder'],
    dependencies: ['brand-identity'],
    parallel: true,
    completion_criteria: ['cold-email.md exists', 'interview-script.md exists', 'reddit-plan.md exists']
  },
  {
    name: 'analytics-judgment',
    phase: 3,
    agents: ['analytics-reporter', 'orch-judge', 'orch-planner'],
    dependencies: ['funnel-content', 'paid-acquisition', 'outbound-validation'],
    parallel: false,
    completion_criteria: ['experiment-summary.md exists', 'scorecard.md exists']
  }
];
