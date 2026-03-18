import fs from 'node:fs/promises';
import path from 'node:path';
import { buildWaitlistPage } from '../builders/waitlist-page.ts';
import { generateCumulativeReport } from '../analytics/cumulative.ts';
import { evaluateExperimentStatus, persistExperimentStatus } from '../analytics/experiment-runner.ts';
import { generateDailyReport } from '../analytics/reporter.ts';
import { generateScorecard } from '../judgment/scorecard.ts';
import { STATE_ROOT } from '../utils/paths.ts';
import type { ExperimentBrief } from '../types.ts';
import { assertSwarmDependencies, requireApproval, runSwarm, updatePhase, writeHumanGate } from './swarm-runner.ts';

export async function orchestrate(brief: ExperimentBrief): Promise<void> {
  await updatePhase('BRAND_IDENTITY');
  await runSwarm('brand-identity');

  await updatePhase('PIPELINES');
  await assertSwarmDependencies('funnel-content');
  await runSwarm('funnel-content');
  await assertSwarmDependencies('paid-acquisition');
  await runSwarm('paid-acquisition');
  await assertSwarmDependencies('outbound-validation');
  await runSwarm('outbound-validation');

  await writeHumanGate('HUMAN-REVIEW-1', `# Human Review 1\n\nAll brand assets, copy, and ad plans are ready.\n\nReview:\n- .mvt/output/brand/BRAND.md\n- .mvt/output/funnel/copy/landing-page.md\n- .mvt/output/ads/google-plan.md\n\nRun \`mvt approve phase-2\` to continue.`);
  await requireApproval('phase-2');

  await updatePhase('BUILD_WAITLIST');
  await buildWaitlistPage();

  await writeHumanGate('HUMAN-REVIEW-2', `# Human Review 2\n\nThe waitlist site is available at .mvt/output/waitlist/site/.\n\nPlease review the page, configure the backend endpoint, and run \`mvt launch\` when ready.`);
  await requireApproval('launch');

  await updatePhase('EXPERIMENT');
  const metrics = await generateDailyReport(1);
  const experimentStatus = await evaluateExperimentStatus(metrics, 1);
  await persistExperimentStatus(experimentStatus);
  await generateCumulativeReport();

  await updatePhase('JUDGMENT');
  await generateScorecard();

  await fs.writeFile(path.join(STATE_ROOT, 'output', 'verdict', 'brief-snapshot.json'), JSON.stringify(brief, null, 2), 'utf8');
}
