import { runAgentTask, stateOutput } from './helpers.ts';
import { updateSwarmCompletion } from '../orchestrator/swarm-runner.ts';

export async function runFunnelPipeline(): Promise<void> {
  await runAgentTask({
    type: 'growth-hacker',
    swarm: 'funnel-content',
    phase: 2,
    model_tier: 'strategy',
    title: 'Create funnel architecture',
    description: 'Map funnel stages and validation criteria.',
    expected_outputs: [stateOutput('funnel', 'architecture.md')],
    acceptance_criteria: ['architecture.md includes stage metrics', 'kill criteria are measurable']
  });

  await runAgentTask({
    type: 'content-creator',
    swarm: 'funnel-content',
    phase: 2,
    model_tier: 'content',
    title: 'Create landing page and email copy',
    description: 'Produce landing page copy and email sequence.',
    expected_outputs: [
      stateOutput('funnel', 'copy', 'landing-page.md'),
      stateOutput('funnel', 'copy', 'emails', 'welcome.md'),
      stateOutput('funnel', 'copy', 'emails', 'value-prop.md'),
      stateOutput('funnel', 'copy', 'emails', 'social-proof.md'),
      stateOutput('funnel', 'copy', 'emails', 'behind-scenes.md'),
      stateOutput('funnel', 'copy', 'emails', 'urgency.md'),
      stateOutput('funnel', 'copy', 'emails', 'survey.md')
    ],
    acceptance_criteria: ['landing-page.md includes three headline variants', 'six email files are created']
  });

  await runAgentTask({
    type: 'seo-specialist',
    swarm: 'funnel-content',
    phase: 2,
    model_tier: 'content',
    title: 'Create SEO spec',
    description: 'Produce on-page SEO guidance.',
    expected_outputs: [stateOutput('waitlist', 'seo-spec.md')],
    acceptance_criteria: ['seo-spec.md includes title, description, and schema guidance']
  });

  await runAgentTask({
    type: 'linkedin-creator',
    swarm: 'funnel-content',
    phase: 2,
    model_tier: 'bulk_copy',
    title: 'Create LinkedIn launch posts',
    description: 'Produce five LinkedIn posts.',
    expected_outputs: [
      stateOutput('funnel', 'social', 'linkedin', 'launch-announcement.md'),
      stateOutput('funnel', 'social', 'linkedin', 'problem-agitation.md'),
      stateOutput('funnel', 'social', 'linkedin', 'behind-the-scenes.md'),
      stateOutput('funnel', 'social', 'linkedin', 'social-proof.md'),
      stateOutput('funnel', 'social', 'linkedin', 'last-day.md')
    ],
    acceptance_criteria: ['five LinkedIn post files are created']
  });

  await updateSwarmCompletion('funnel-content');
}
