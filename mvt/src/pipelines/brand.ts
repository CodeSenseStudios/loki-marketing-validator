import { runAgentTask, stateOutput } from './helpers.ts';
import { calculateContrastRatio } from '../utils/validators.ts';
import { updateSwarmCompletion } from '../orchestrator/swarm-runner.ts';

export async function runBrandPipeline(): Promise<void> {
  await runAgentTask({
    type: 'brand-guardian',
    swarm: 'brand-identity',
    phase: 1,
    model_tier: 'strategy',
    title: 'Create brand system',
    description: 'Produce BRAND.md from the experiment brief.',
    expected_outputs: [stateOutput('brand', 'BRAND.md')],
    acceptance_criteria: ['BRAND.md contains all required sections', 'Color palette uses concrete hex values']
  });

  const contrast = calculateContrastRatio('#F8FAFC', '#0F172A');
  if (contrast < 4.5) {
    throw new Error('Brand contrast ratio failed WCAG AA.');
  }

  await runAgentTask({
    type: 'ui-designer',
    swarm: 'brand-identity',
    phase: 1,
    model_tier: 'strategy',
    title: 'Create page spec',
    description: 'Produce page-spec.md from the brand system.',
    expected_outputs: [stateOutput('brand', 'page-spec.md')],
    acceptance_criteria: ['page-spec.md includes layout, tokens, and breakpoints']
  });

  await runAgentTask({
    type: 'ux-researcher',
    swarm: 'brand-identity',
    phase: 1,
    model_tier: 'content',
    title: 'Create personas and interview guide',
    description: 'Produce personas and interview guide.',
    expected_outputs: [stateOutput('brand', 'personas.md'), stateOutput('outbound', 'interview-guide.md')],
    acceptance_criteria: ['personas.md contains at least two persona cards', 'interview-guide.md includes a 15-minute structure']
  });

  await updateSwarmCompletion('brand-identity');
}
