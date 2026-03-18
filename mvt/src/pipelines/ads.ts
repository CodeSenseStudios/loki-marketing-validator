import { runAgentTask, stateOutput } from './helpers.ts';
import { updateSwarmCompletion } from '../orchestrator/swarm-runner.ts';

export async function runAdsPipeline(): Promise<void> {
  await runAgentTask({
    type: 'paid-social-strategist',
    swarm: 'paid-acquisition',
    phase: 2,
    model_tier: 'strategy',
    title: 'Create social ads plan',
    description: 'Score channels and define targeting.',
    expected_outputs: [stateOutput('ads', 'social-plan.md')],
    acceptance_criteria: ['social-plan.md includes a scored platform matrix']
  });

  await runAgentTask({
    type: 'ppc-strategist',
    swarm: 'paid-acquisition',
    phase: 2,
    model_tier: 'strategy',
    title: 'Create Google Ads plan',
    description: 'Build search and display structure.',
    expected_outputs: [stateOutput('ads', 'google-plan.md')],
    acceptance_criteria: ['google-plan.md includes campaigns, groups, and keywords']
  });

  await runAgentTask({
    type: 'tracking-specialist',
    swarm: 'paid-acquisition',
    phase: 2,
    model_tier: 'data',
    title: 'Create tracking plan',
    description: 'Define GTM, GA4, and conversion events.',
    expected_outputs: [stateOutput('ads', 'tracking-plan.md')],
    acceptance_criteria: ['tracking-plan.md includes GTM, GA4, and UTM sections']
  });

  await runAgentTask({
    type: 'ad-creative-strategist',
    swarm: 'paid-acquisition',
    phase: 2,
    model_tier: 'bulk_copy',
    title: 'Create ad variants',
    description: 'Generate creative bundles and A/B matrix.',
    expected_outputs: [
      stateOutput('ads', 'creatives', 'google-rsa.md'),
      stateOutput('ads', 'creatives', 'meta-ads.md'),
      stateOutput('ads', 'creatives', 'linkedin-ads.md'),
      stateOutput('ads', 'creatives', 'ab-test-matrix.md')
    ],
    acceptance_criteria: ['creative files are created for Google, Meta, and LinkedIn', 'ab-test-matrix.md exists']
  });

  await updateSwarmCompletion('paid-acquisition');
}
