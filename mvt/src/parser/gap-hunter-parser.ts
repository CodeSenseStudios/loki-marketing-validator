import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_CONFIG, loadJsonYaml } from '../utils/config.ts';
import { fileExists, writeFileAtomic, writeJsonFile } from '../utils/fs.ts';
import { STATE_ROOT } from '../utils/paths.ts';
import type { ExperimentBrief } from '../types.ts';

export async function parseGapHunterOutput(): Promise<ExperimentBrief> {
  const inputDir = path.join(STATE_ROOT, 'input');
  const opportunityPath = path.join(inputDir, 'opportunity.json');
  const prdPath = path.join(inputDir, 'prd.md');
  const financialsPath = path.join(inputDir, 'financials.json');
  const competitorsPath = path.join(inputDir, 'competitors.json');

  if (!(await fileExists(prdPath))) {
    throw new Error('Missing PRD: .mvt/input/prd.md');
  }

  const opportunity = (await fileExists(opportunityPath))
    ? await loadJsonYaml<Record<string, unknown>>(opportunityPath)
    : {};
  const financials = (await fileExists(financialsPath))
    ? await loadJsonYaml<Record<string, unknown>>(financialsPath)
    : {};
  const competitors = (await fileExists(competitorsPath))
    ? await loadJsonYaml<Array<Record<string, unknown>>>(competitorsPath)
    : [];
  const prd = await fs.readFile(prdPath, 'utf8');

  const productName = extractProductName(prd, opportunity);
  const price = Number(financials.target_price_point ?? financials.price_point ?? 30);
  const targetMrr = Number(financials.target_mrr ?? 3000);
  const minSignups = Math.max(10, Math.ceil((targetMrr / Math.max(price, 1)) * 0.1));

  const brief: ExperimentBrief = {
    opportunity_name: String(opportunity.opportunity_name ?? productName),
    opportunity_score: Number(opportunity.opportunity_score ?? 0),
    target_industries: toArray(opportunity.target_industries ?? guessIndustries(prd)),
    target_audience: {
      persona: extractPersona(prd, opportunity),
      pain_points: extractBullets(prd, 'pain', 'problem'),
      current_solutions: extractBullets(prd, 'current', 'solution'),
      willingness_to_pay_range: {
        min: Math.max(5, Math.round(price * 0.5)),
        max: Math.max(10, Math.round(price * 1.5))
      }
    },
    product_name: productName,
    one_liner: extractOneLiner(prd),
    key_features: extractBullets(prd, 'feature', 'capability').slice(0, 5),
    differentiators: extractBullets(prd, 'different', 'advantage').slice(0, 5),
    target_mrr: targetMrr,
    target_price_point: price,
    cac_budget: Number(financials.cac_budget ?? DEFAULT_CONFIG.experiment.target_cac),
    payback_months: Number(financials.payback_months ?? 12),
    competitors: competitors.map((item) => ({
      name: String(item.name ?? 'Unknown competitor'),
      positioning: String(item.positioning ?? 'Manual review required'),
      pricing: String(item.pricing ?? 'Unknown'),
      weaknesses: toArray(item.weaknesses ?? ['Manual review required'])
    })),
    experiment_hypothesis: '',
    success_criteria: {
      min_signups: minSignups,
      max_cac: Number(financials.cac_budget ?? DEFAULT_CONFIG.experiment.target_cac),
      min_conversion_rate: 0.03,
      experiment_duration_days: DEFAULT_CONFIG.experiment.duration_days
    }
  };

  brief.experiment_hypothesis = `We believe ${brief.target_audience.persona} will sign up for ${brief.product_name} because ${brief.one_liner.toLowerCase()}.`;
  validateExperimentBrief(brief);

  await writeJsonFile(path.join(STATE_ROOT, 'output', 'experiment-brief.json'), brief);
  await writeFileAtomic(path.join(STATE_ROOT, 'EXPERIMENT.md'), renderExperimentMarkdown(brief));
  return brief;
}

export function validateExperimentBrief(brief: ExperimentBrief): void {
  const required: Array<[string, unknown]> = [
    ['opportunity_name', brief.opportunity_name],
    ['product_name', brief.product_name],
    ['one_liner', brief.one_liner],
    ['target_price_point', brief.target_price_point],
    ['experiment_hypothesis', brief.experiment_hypothesis]
  ];
  const missing = required.filter(([, value]) => value === '' || value === null || value === undefined);
  if (missing.length > 0) {
    throw new Error(`Incomplete ExperimentBrief: ${missing.map(([key]) => key).join(', ')}`);
  }
}

function renderExperimentMarkdown(brief: ExperimentBrief): string {
  return `# Experiment Brief

## Product
- Opportunity: ${brief.opportunity_name}
- Product: ${brief.product_name}
- One-liner: ${brief.one_liner}

## Audience
- Persona: ${brief.target_audience.persona}
- Industries: ${brief.target_industries.join(', ')}
- Pain points:
${brief.target_audience.pain_points.map((item) => `  - ${item}`).join('\n')}

## Success Criteria
- Minimum signups: ${brief.success_criteria.min_signups}
- Maximum CAC: ${brief.success_criteria.max_cac}
- Minimum conversion rate: ${(brief.success_criteria.min_conversion_rate * 100).toFixed(1)}%
- Duration: ${brief.success_criteria.experiment_duration_days} days

## Hypothesis
${brief.experiment_hypothesis}

## Manual Review Flags
- Domain availability: manual verification required
- Trademark conflicts: manual verification required
- Live subreddit validation: manual verification required
`;
}

function extractProductName(prd: string, opportunity: Record<string, unknown>): string {
  const heading = prd.match(/^#\s+(.+)$/m)?.[1];
  return String(opportunity.product_name ?? heading ?? 'Untitled Opportunity').trim();
}

function extractOneLiner(prd: string): string {
  const firstParagraph = prd
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('#'));
  return (firstParagraph ?? 'A product that solves an important workflow pain point.').split(/[.!?]/)[0].trim() + '.';
}

function extractPersona(prd: string, opportunity: Record<string, unknown>): string {
  const explicit = String(opportunity.persona ?? '').trim();
  if (explicit) {
    return explicit;
  }
  const match = prd.match(/for\s+([A-Za-z0-9 ,/-]+?)\s+(who|that)\b/i);
  return match?.[1]?.trim() ?? 'Operators dealing with the problem described in the PRD';
}

function extractBullets(prd: string, ...keywords: string[]): string[] {
  const lines = prd.split(/\r?\n/).map((line) => line.trim());
  const bullets = lines.filter((line) => /^[-*]\s+/.test(line)).map((line) => line.replace(/^[-*]\s+/, ''));
  const keywordMatches = bullets.filter((line) => keywords.some((keyword) => line.toLowerCase().includes(keyword)));
  if (keywordMatches.length > 0) {
    return keywordMatches;
  }
  return bullets.slice(0, 5).length > 0 ? bullets.slice(0, 5) : ['Manual review required'];
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function guessIndustries(prd: string): string[] {
  if (/health/i.test(prd)) {
    return ['Healthcare'];
  }
  if (/finance|payments/i.test(prd)) {
    return ['Fintech'];
  }
  return ['SaaS'];
}
