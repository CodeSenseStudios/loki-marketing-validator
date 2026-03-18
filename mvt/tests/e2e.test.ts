import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runMvt } from '../src/main.ts';
import { STATE_ROOT } from '../src/utils/paths.ts';
import { fixtureDir, resetState } from './helpers.ts';

test('full local mock pipeline generates core outputs', async () => {
  process.env.MVT_MOCK_MODE = 'true';
  process.env.MVT_AUTO_APPROVE = 'true';
  await resetState();
  await runMvt(fixtureDir('gap-hunter'));
  const scorecard = await fs.readFile(path.join(STATE_ROOT, 'output', 'verdict', 'scorecard.md'), 'utf8');
  const indexHtml = await fs.readFile(path.join(STATE_ROOT, 'output', 'waitlist', 'site', 'index.html'), 'utf8');
  assert.match(scorecard, /Go\/No-Go Scorecard/);
  assert.match(indexHtml, /waitlist-form/);
});
