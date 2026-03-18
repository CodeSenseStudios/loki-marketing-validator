import path from 'node:path';
import { readJsonFile, writeJsonFile } from '../utils/fs.ts';
import { STATE_ROOT } from '../utils/paths.ts';
import type { ExperimentStatus } from '../types.ts';
import { DEFAULT_CONFIG } from '../utils/config.ts';
import type { DailyMetrics } from './reporter.ts';

export function evaluateExperimentStatus(metrics: DailyMetrics, day = 1): ExperimentStatus {
  const targetSignups = DEFAULT_CONFIG.experiment.min_signups_for_go;
  const status: ExperimentStatus = {
    day,
    total_days: DEFAULT_CONFIG.experiment.duration_days,
    signups: metrics.totalSignups,
    target_signups: targetSignups,
    cac: metrics.cac,
    target_cac: DEFAULT_CONFIG.experiment.target_cac,
    budget_spent: metrics.spend,
    budget_total: DEFAULT_CONFIG.experiment.budget_usd,
    interview_score: metrics.averageInterviewScore,
    status: 'running',
    recommendation: 'Continue collecting demand signals.'
  };

  if (metrics.cac > status.target_cac * 3 && metrics.totalSignups < 10) {
    status.status = 'early_kill';
    status.recommendation = 'Demand signal too weak at this price point.';
  } else if (metrics.conversionRate < 0.005 && metrics.sessions >= 500) {
    status.status = 'early_kill';
    status.recommendation = 'Landing page or offer is not resonating.';
  } else if (metrics.spend > status.budget_total * 0.8 && metrics.totalSignups < status.target_signups * 0.2) {
    status.status = 'early_kill';
    status.recommendation = 'Economics do not support continuing the experiment.';
  } else if (metrics.totalSignups >= status.target_signups || (metrics.cac > 0 && metrics.cac < status.target_cac * 0.5)) {
    status.status = 'early_success';
    status.recommendation = 'Strong demand signal. Consider moving to judgment.';
  } else if (day >= status.total_days) {
    status.status = 'completed';
    status.recommendation = 'Experiment window complete. Run the completion council.';
  }

  return status;
}

export async function persistExperimentStatus(status: ExperimentStatus): Promise<void> {
  const orchestratorPath = path.join(STATE_ROOT, 'state', 'orchestrator.json');
  const current = await readJsonFile<Record<string, any>>(orchestratorPath, {});
  current.experiment_status = status;
  current.updated_at = new Date().toISOString();
  await writeJsonFile(orchestratorPath, current);
}
