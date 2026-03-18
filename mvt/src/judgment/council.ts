import fs from 'node:fs/promises';
import path from 'node:path';
import { STATE_ROOT } from '../utils/paths.ts';

export type CouncilVote = 'GO' | 'NO-GO' | 'CONDITIONAL';

export interface CouncilMemberResult {
  member: 'Market Advocate' | 'Financial Realist' | 'Devils Advocate';
  vote: CouncilVote;
  assessment: string;
}

export async function runCouncil(): Promise<{ verdict: CouncilVote; members: CouncilMemberResult[]; challengeRound: string }> {
  const summary = await readText(path.join(STATE_ROOT, 'output', 'analytics', 'experiment-summary.md'));
  const signups = Number(summary.match(/Signups: (\d+)/)?.[1] ?? 0);
  const spend = Number(summary.match(/Spend: \$(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const avgScore = Number(summary.match(/Average interview score: (\d+(?:\.\d+)?)/)?.[1] ?? 0);

  const marketVote: CouncilVote = signups >= 10 || avgScore >= 3.5 ? 'GO' : 'CONDITIONAL';
  const financeVote: CouncilVote = spend <= 500 ? 'GO' : 'CONDITIONAL';
  const devilVote: CouncilVote =
    signups < 5 && avgScore < 3
      ? 'NO-GO'
      : signups >= 10 && avgScore >= 3.5
        ? 'GO'
        : 'CONDITIONAL';

  const members: CouncilMemberResult[] = [
    {
      member: 'Market Advocate',
      vote: marketVote,
      assessment: buildAssessment('Market Advocate', 'Demand is strongest when multiple channels point to the same pain.', signups, spend, avgScore)
    },
    {
      member: 'Financial Realist',
      vote: financeVote,
      assessment: buildAssessment('Financial Realist', 'Unit economics matter more than narrative enthusiasm.', signups, spend, avgScore)
    },
    {
      member: 'Devils Advocate',
      vote: devilVote,
      assessment: buildAssessment('Devils Advocate', 'The burden of proof is high; weak evidence should not be dressed up as validation.', signups, spend, avgScore)
    }
  ];

  const allGo = members.every((member) => member.vote === 'GO');
  const challengeRound = allGo
    ? 'Unanimous GO detected. Devils Advocate challenge: what could still break? Missing live channel validation, live deployment verification, and external account setup remain human-gated.'
    : 'Challenge round not required by unanimous GO rule, but conditional concerns remain documented.';

  const goCount = members.filter((member) => member.vote === 'GO').length;
  const noGoCount = members.filter((member) => member.vote === 'NO-GO').length;
  const verdict: CouncilVote = noGoCount >= 2 ? 'NO-GO' : goCount >= 2 ? 'GO' : 'CONDITIONAL';

  await fs.writeFile(path.join(STATE_ROOT, 'output', 'verdict', 'council.json'), JSON.stringify({ verdict, members, challengeRound }, null, 2), 'utf8');
  return { verdict, members, challengeRound };
}

function buildAssessment(member: string, principle: string, signups: number, spend: number, avgScore: number): string {
  return `${member} Assessment\n\n${principle} This experiment produced ${signups} signups against a spend profile of $${spend.toFixed(2)} with an average interview score of ${avgScore.toFixed(2)}. The right reading is not whether the idea feels exciting, but whether these signals reduce uncertainty enough to justify the next stage. Strengths include the existence of a structured funnel, a deployable page, coordinated paid and outbound assets, and a documented measurement plan. Weaknesses include the remaining need for live deployment verification, domain and trademark checks, subreddit validation, and any external account setup that still sits behind human approval. The recommendation should therefore stay disciplined: move forward only to the extent that the evidence supports confidence, and avoid overstating certainty where the current run still relies on local scaffolding and mock-mode safe defaults.`;
}

async function readText(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}
