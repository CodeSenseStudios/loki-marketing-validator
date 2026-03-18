import { runAgentTask, stateOutput } from './helpers.ts';
import { updateSwarmCompletion } from '../orchestrator/swarm-runner.ts';

export async function runOutboundPipeline(): Promise<void> {
  await runAgentTask({
    type: 'outbound-strategist',
    swarm: 'outbound-validation',
    phase: 2,
    model_tier: 'strategy',
    title: 'Create outbound sequences',
    description: 'Produce cold email, LinkedIn DM, and targeting assets.',
    expected_outputs: [
      stateOutput('outbound', 'sequences', 'cold-email.md'),
      stateOutput('outbound', 'sequences', 'linkedin-dm.md'),
      stateOutput('outbound', 'targeting.md')
    ],
    acceptance_criteria: ['outbound sequence files exist', 'targeting.md includes specific ICP criteria']
  });

  await runAgentTask({
    type: 'discovery-coach',
    swarm: 'outbound-validation',
    phase: 2,
    model_tier: 'strategy',
    title: 'Create interview script',
    description: 'Produce interview script and scoring rubric.',
    expected_outputs: [stateOutput('outbound', 'interview-script.md'), stateOutput('outbound', 'signal-scoring.md')],
    acceptance_criteria: ['interview script covers all five sections', 'signal scoring contains numeric thresholds']
  });

  await runAgentTask({
    type: 'reddit-builder',
    swarm: 'outbound-validation',
    phase: 2,
    model_tier: 'content',
    title: 'Create Reddit plan',
    description: 'Produce subreddit plan and authentic drafts.',
    expected_outputs: [stateOutput('outbound', 'reddit-plan.md')],
    acceptance_criteria: ['reddit-plan.md includes subreddits, post drafts, and engagement rules']
  });

  await updateSwarmCompletion('outbound-validation');
}
