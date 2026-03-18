import fs from 'node:fs/promises';
import path from 'node:path';
import { collectAnalyticsData } from './collector.ts';
import { STATE_ROOT } from '../utils/paths.ts';

export async function generateCumulativeReport(): Promise<string> {
  const data = await collectAnalyticsData();
  const totalSpend = [...data.googleAds, ...data.metaAds].reduce((sum, row) => sum + Number(row.spend ?? 0), 0);
  const totalSignups = data.signups.length;
  const summary = `# Experiment Summary

## Totals
- Signups: ${totalSignups}
- Spend: $${totalSpend.toFixed(2)}
- Best channel: Manual review required
- Best ad creative: Manual review required
- A/B winner: Manual review required
- Interview count: ${data.interviews.length}
- Average interview score: ${data.interviews.length ? (data.interviews.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / data.interviews.length).toFixed(2) : '0.00'}

## Signup Curve
${'▁▂▃▄▅▆▇'.slice(0, Math.max(1, Math.min(7, totalSignups || 1)))}

## Data Quality Warnings
${data.warnings.length ? data.warnings.map((warning) => `- ${warning}`).join('\n') : '- None'}
`;
  await fs.writeFile(path.join(STATE_ROOT, 'output', 'analytics', 'experiment-summary.md'), summary, 'utf8');
  return summary;
}
