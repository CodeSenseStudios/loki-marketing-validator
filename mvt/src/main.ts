import { initAll } from './bootstrap/init.ts';
import { materializeAgentAssets } from './agents/materialize.ts';
import { parseGapHunterOutput } from './parser/gap-hunter-parser.ts';
import { orchestrate } from './orchestrator/planner.ts';

export async function runMvt(gapHunterDir?: string): Promise<void> {
  await initAll({ gapHunterDir, skipEnvValidation: process.env.MVT_MOCK_MODE === 'true' });
  await materializeAgentAssets();
  const brief = await parseGapHunterOutput();
  await orchestrate(brief);
}
