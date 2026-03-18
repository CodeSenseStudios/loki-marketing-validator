import fs from 'node:fs/promises';
import path from 'node:path';
import { collectAnalyticsData } from './collector.ts';
import { STATE_ROOT } from '../utils/paths.ts';

export interface DailyMetrics {
  totalSignups: number;
  signupsToday: number;
  sessions: number;
  conversionRate: number;
  spend: number;
  cac: number;
  referralSignups: number;
  averageInterviewScore: number;
  warnings: string[];
}

export async function generateDailyReport(day = 1): Promise<DailyMetrics> {
  const data = await collectAnalyticsData();
  const totalSignups = data.signups.length;
  const sessions = data.ga4.reduce((sum, row) => sum + Number(row.sessions ?? 0), 0);
  const spend = [...data.googleAds, ...data.metaAds].reduce((sum, row) => sum + Number(row.spend ?? 0), 0);
  const referralSignups = data.signups.filter((row) => row.referral_code).length;
  const averageInterviewScore = data.interviews.length
    ? data.interviews.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / data.interviews.length
    : 0;
  const signupsToday = totalSignups;
  const conversionRate = sessions > 0 ? totalSignups / sessions : 0;
  const cac = totalSignups > 0 ? spend / totalSignups : spend;

  const markdown = `# Experiment Day ${day} - ${new Date().toISOString().slice(0, 10)}

## Key Metrics
- Total signups: ${totalSignups}
- Signups today: ${signupsToday}
- Conversion rate (visit -> signup): ${(conversionRate * 100).toFixed(2)}%
- Total ad spend: $${spend.toFixed(2)}
- Cost per signup (CAC): $${cac.toFixed(2)}
- Referral signups: ${referralSignups}

## Traffic Sources
| Source | Visits | Signups | Conv Rate | Cost | CAC |
|--------|--------|---------|-----------|------|-----|
| Google Ads | ${sessions} | ${totalSignups} | ${(conversionRate * 100).toFixed(2)}% | $${spend.toFixed(2)} | $${cac.toFixed(2)} |
| Meta Ads | 0 | 0 | 0.00% | $0.00 | $0.00 |
| LinkedIn | 0 | 0 | 0.00% | $0.00 | $0.00 |
| Reddit | 0 | 0 | 0.00% | $0.00 | $0.00 |
| Direct/Organic | 0 | 0 | 0.00% | $0.00 | $0.00 |
| Referral | ${referralSignups} | ${referralSignups} | 100.00% | $0.00 | $0.00 |

## A/B Test Status
| Variant | Visitors | Signups | Conv Rate | Confidence |
|---------|----------|---------|-----------|------------|
| Headline A | 0 | 0 | 0.00% | low |
| Headline B | 0 | 0 | 0.00% | low |
| Headline C | 0 | 0 | 0.00% | low |

## Email Sequence Performance
| Email | Sent | Opened | Open Rate | Clicked | CTR |
|-------|------|--------|-----------|---------|-----|
| Welcome | 0 | 0 | 0.00% | 0 | 0.00% |
| Value Prop | 0 | 0 | 0.00% | 0 | 0.00% |
| Social Proof | 0 | 0 | 0.00% | 0 | 0.00% |
| Urgency | 0 | 0 | 0.00% | 0 | 0.00% |

## Interview Signals
- Interviews completed: ${data.interviews.length}
- Average signal score: ${averageInterviewScore.toFixed(2)} / 5
- Would pay: ${data.interviews.filter((row) => row.would_pay).length} / ${data.interviews.length}

## Trend
- Signup velocity: ${signupsToday > 0 ? 'steady' : 'flat'}
- CAC trend: ${cac > 0 ? 'watch closely' : 'stable'}

## Flags
${data.warnings.length ? data.warnings.map((warning) => `- ${warning}`).join('\n') : '- None'}
`;

  const dailyDir = path.join(STATE_ROOT, 'output', 'analytics', 'daily');
  await fs.mkdir(dailyDir, { recursive: true });
  await fs.writeFile(path.join(dailyDir, `day-${day}.md`), markdown, 'utf8');
  return { totalSignups, signupsToday, sessions, conversionRate, spend, cac, referralSignups, averageInterviewScore, warnings: data.warnings };
}
