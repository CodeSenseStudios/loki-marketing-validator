import test from 'node:test';
import assert from 'node:assert/strict';
import { initAll } from '../src/bootstrap/init.ts';
import { claimTask, createTask } from '../src/queue/queue.ts';
import { fixtureDir, resetState } from './helpers.ts';

test('queue respects dependencies when claiming tasks', async () => {
  process.env.MVT_MOCK_MODE = 'true';
  await resetState();
  await initAll({ gapHunterDir: fixtureDir('gap-hunter'), skipEnvValidation: true });
  await createTask({
    id: 'task-a',
    type: 'brand-guardian',
    swarm: 'brand-identity',
    phase: 1,
    model_tier: 'strategy',
    title: 'A',
    description: 'first'
  });
  await createTask({
    id: 'task-b',
    type: 'ui-designer',
    swarm: 'brand-identity',
    phase: 1,
    model_tier: 'strategy',
    title: 'B',
    description: 'blocked',
    depends_on: ['task-a']
  });
  const uiTask = await claimTask('ui-designer');
  assert.equal(uiTask, null);
  const brandTask = await claimTask('brand-guardian');
  assert.equal(brandTask?.id, 'task-a');
});
