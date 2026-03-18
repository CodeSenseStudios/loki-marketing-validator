import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { initAll } from '../src/bootstrap/init.ts';
import { collectAnalyticsData } from '../src/analytics/collector.ts';
import { evaluateExperimentStatus } from '../src/analytics/experiment-runner.ts';
import { generateDailyReport } from '../src/analytics/reporter.ts';
import { STATE_ROOT } from '../src/utils/paths.ts';
import { fixtureDir, resetState } from './helpers.ts';

test('analytics reports and status handle local data', async () => {
  process.env.MVT_MOCK_MODE = 'true';
  await resetState();
  await initAll({ gapHunterDir: fixtureDir('gap-hunter'), skipEnvValidation: true });
  const dataDir = path.join(STATE_ROOT, 'input', 'data');
  await fs.writeFile(path.join(dataDir, 'signups.csv'), 'email,timestamp,source,referral_code\na@test.com,2026-03-17,google,ref1\n', 'utf8');
  await fs.writeFile(path.join(dataDir, 'ga4-daily.csv'), 'date,sessions,page_views,signup_events\n2026-03-17,100,200,1\n', 'utf8');
  await fs.writeFile(path.join(dataDir, 'google-ads.csv'), 'date,campaign,impressions,clicks,spend\n2026-03-17,test,1000,50,25\n', 'utf8');
  await fs.writeFile(path.join(dataDir, 'meta-ads.csv'), 'date,campaign,impressions,clicks,spend\n2026-03-17,test,0,0,0\n', 'utf8');
  await fs.writeFile(path.join(dataDir, 'interviews.json'), JSON.stringify([{ date: '2026-03-17', score: 4, would_pay: true }], null, 2), 'utf8');
  const collected = await collectAnalyticsData();
  const metrics = await generateDailyReport(1);
  const status = await evaluateExperimentStatus(metrics, 1);
  assert.equal(collected.signups.length, 1);
  assert.equal(status.status, 'running');
});
