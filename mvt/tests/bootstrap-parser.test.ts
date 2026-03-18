import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { initAll } from '../src/bootstrap/init.ts';
import { materializeAgentAssets } from '../src/agents/materialize.ts';
import { parseGapHunterOutput } from '../src/parser/gap-hunter-parser.ts';
import { STATE_ROOT } from '../src/utils/paths.ts';
import { fixtureDir, resetState } from './helpers.ts';

test('bootstrap and parser create core state and experiment brief', async () => {
  process.env.MVT_MOCK_MODE = 'true';
  await resetState();
  await initAll({ gapHunterDir: fixtureDir('gap-hunter'), skipEnvValidation: true });
  await materializeAgentAssets();
  const brief = await parseGapHunterOutput();
  const continuity = await fs.readFile(path.join(STATE_ROOT, 'CONTINUITY.md'), 'utf8');
  const brandAgent = await fs.readFile(path.join(STATE_ROOT, 'agents', 'brand-guardian.md'), 'utf8');
  assert.equal(brief.product_name, 'Signal Pilot');
  assert.match(continuity, /Current Phase/);
  assert.match(brandAgent, /Brand Guardian/);
});
