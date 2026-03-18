import fs from 'node:fs/promises';
import path from 'node:path';
import { STATE_ROOT } from '../utils/paths.ts';
import type { CouncilVote } from './council.ts';
import { runCouncil } from './council.ts';

export async function generateScorecard(): Promise<string> {
  const council = await runCouncil();
  const summary = await readText(path.join(STATE_ROOT, 'output', 'analytics', 'experiment-summary.md'));
  const signups = Number(summary.match(/Signups: (\d+)/)?.[1] ?? 0);
  const spend = Number(summary.match(/Spend: \$(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const avgScore = Number(summary.match(/Average interview score: (\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const openRate = 0;
  const referralRate = signups > 0 ? 0 : 0;
  const verdict = council.verdict;
  const scorecard = `# Go/No-Go Scorecard

## Date: ${new Date().toISOString().slice(0, 10)}
## Verdict: ${verdict}

## Quantitative Scores
| Metric | Target | Actual | Pass? |
|--------|--------|--------|-------|
| Total signups | 100 | ${signups} | ${pass(signups >= 100)} |
| Cost per signup (CAC) | < $5 | ${signups > 0 ? (spend / signups).toFixed(2) : spend.toFixed(2)} | ${pass(signups > 0 && spend / signups < 5)} |
| Landing page conversion | > 3% | 0.00% | ${pass(false)} |
| Email open rate | > 30% | ${openRate.toFixed(2)}% | ${pass(openRate > 30)} |
| Referral rate | > 10% | ${(referralRate * 100).toFixed(2)}% | ${pass(referralRate > 0.1)} |
| Interview signal score | > 3.5/5 | ${avgScore.toFixed(2)} | ${pass(avgScore > 3.5)} |
| Willingness to pay | > 50% | manual | ${pass(false)} |
| A/B test winner identified | Yes | manual | ${pass(false)} |

## Council Assessments
${council.members.map((member) => `### ${member.member}\n${member.assessment}\n\n**Vote: ${member.vote}**`).join('\n\n')}

## Challenge Round
${council.challengeRound}

## Recommendation
${recommendation(verdict)}
`;
  await fs.writeFile(path.join(STATE_ROOT, 'output', 'verdict', 'scorecard.md'), scorecard, 'utf8');
  if (verdict === 'GO') {
    await fs.writeFile(path.join(STATE_ROOT, 'output', 'verdict', 'loki-handoff.md'), buildHandoff(summary), 'utf8');
  }
  return scorecard;
}

function pass(value: boolean): string {
  return value ? 'PASS' : 'FAIL';
}

function recommendation(verdict: CouncilVote): string {
  if (verdict === 'GO') {
    return 'Proceed to Loki Mode with the validated messaging, audience, and waitlist learnings.';
  }
  if (verdict === 'NO-GO') {
    return 'Do not advance to product build until a stronger market signal exists.';
  }
  return 'Proceed only after clearing manual review gaps and improving demand evidence.';
}

function buildHandoff(summary: string): string {
  return `# Loki Handoff\n\nUse this package as the starting point for product development.\n\n## Experiment Learnings\n${summary}\n\n## Included Assets\n- Brand assets in .mvt/output/brand\n- Funnel copy in .mvt/output/funnel\n- Waitlist site in .mvt/output/waitlist/site\n- Waitlist data in .mvt/input/data\n`;
}

async function readText(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}
