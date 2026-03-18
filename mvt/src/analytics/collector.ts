import fs from 'node:fs/promises';
import path from 'node:path';
import { STATE_ROOT } from '../utils/paths.ts';

export interface CollectedData {
  signups: Array<Record<string, string>>;
  ga4: Array<Record<string, string>>;
  googleAds: Array<Record<string, string>>;
  metaAds: Array<Record<string, string>>;
  interviews: Array<{ date: string; score: number; notes?: string; would_pay?: boolean; persona_match?: boolean }>;
  warnings: string[];
}

export async function collectAnalyticsData(): Promise<CollectedData> {
  const dataDir = path.join(STATE_ROOT, 'input', 'data');
  const warnings: string[] = [];
  const signups = await readCsv(path.join(dataDir, 'signups.csv'), ['email', 'timestamp'], warnings);
  const ga4 = await readCsv(path.join(dataDir, 'ga4-daily.csv'), ['date', 'sessions', 'page_views'], warnings);
  const googleAds = await readCsv(path.join(dataDir, 'google-ads.csv'), ['date', 'campaign', 'clicks', 'spend'], warnings);
  const metaAds = await readCsv(path.join(dataDir, 'meta-ads.csv'), ['date', 'campaign', 'clicks', 'spend'], warnings);
  const interviews = await readInterviews(path.join(dataDir, 'interviews.json'), warnings);
  validateNoDuplicateEmails(signups, warnings);
  return { signups, ga4, googleAds, metaAds, interviews, warnings };
}

async function readCsv(filePath: string, required: string[], warnings: string[]): Promise<Array<Record<string, string>>> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const rows = raw.trim().split(/\r?\n/);
    if (rows.length === 0) {
      return [];
    }
    const headers = rows[0].split(',').map((item) => item.trim());
    const missing = required.filter((key) => !headers.includes(key));
    if (missing.length > 0) {
      warnings.push(`${path.basename(filePath)} missing columns: ${missing.join(', ')}`);
    }
    return rows.slice(1).filter(Boolean).map((row) => {
      const values = row.split(',');
      return Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? '').trim()]));
    });
  } catch {
    warnings.push(`Missing data file: ${path.basename(filePath)}`);
    return [];
  }
}

async function readInterviews(filePath: string, warnings: string[]) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    warnings.push('Missing data file: interviews.json');
    return [];
  }
}

function validateNoDuplicateEmails(signups: Array<Record<string, string>>, warnings: string[]) {
  const seen = new Set<string>();
  for (const signup of signups) {
    const email = signup.email?.toLowerCase();
    if (!email) {
      continue;
    }
    if (seen.has(email)) {
      warnings.push(`Duplicate signup email detected: ${email}`);
    }
    seen.add(email);
  }
}
