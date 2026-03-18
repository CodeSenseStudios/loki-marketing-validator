import fs from 'node:fs/promises';
import path from 'node:path';
import { initAll } from './bootstrap/init.ts';
import { generateCumulativeReport } from './analytics/cumulative.ts';
import { evaluateExperimentStatus, persistExperimentStatus } from './analytics/experiment-runner.ts';
import { generateDailyReport } from './analytics/reporter.ts';
import { generateScorecard } from './judgment/scorecard.ts';
import { runMvt } from './main.ts';
import { ModelRouter } from './router/model-router.ts';
import { STATE_ROOT } from './utils/paths.ts';
import { readJsonFile } from './utils/fs.ts';
import { setApproval } from './orchestrator/swarm-runner.ts';

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }

  if (command === 'init') {
    await initAll({ gapHunterDir: rest[0], skipEnvValidation: process.env.MVT_MOCK_MODE === 'true' });
    console.log('Initialized .mvt runtime tree.');
    return;
  }

  if (command === 'run') {
    await runMvt(rest[0]);
    console.log('MVT pipeline completed.');
    return;
  }

  if (command === 'status') {
    const state = await readJsonFile<Record<string, unknown>>(path.join(STATE_ROOT, 'state', 'orchestrator.json'), {});
    console.log(JSON.stringify(state, null, 2));
    return;
  }

  if (command === 'approve') {
    const gate = rest[0];
    if (!gate) throw new Error('Usage: mvt approve <gate>');
    await setApproval(gate, true);
    console.log(`Approved ${gate}.`);
    return;
  }

  if (command === 'launch') {
    await setApproval('launch', true);
    console.log('Launch gate approved.');
    return;
  }

  if (command === 'report') {
    const metrics = await generateDailyReport(1);
    const status = await evaluateExperimentStatus(metrics, 1);
    await persistExperimentStatus(status);
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  if (command === 'kill') {
    const state = await readJsonFile<Record<string, any>>(path.join(STATE_ROOT, 'state', 'orchestrator.json'), {});
    state.experiment_status = { ...(state.experiment_status ?? {}), status: 'early_kill', recommendation: 'Killed manually.' };
    await fs.writeFile(path.join(STATE_ROOT, 'state', 'orchestrator.json'), JSON.stringify(state, null, 2), 'utf8');
    console.log('Experiment marked early_kill.');
    return;
  }

  if (command === 'verdict') {
    const markdown = await generateScorecard();
    console.log(markdown);
    return;
  }

  if (command === 'cost') {
    const summary = await new ModelRouter().getCostSummary();
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (command === 'resume') {
    await runMvt(rest[0]);
    console.log('Resumed MVT pipeline.');
    return;
  }

  if (command === 'deploy') {
    console.log(`Deployment helper invoked for ${rest[0] ?? 'unknown target'}. See .mvt/output/waitlist/DEPLOY.md.`);
    return;
  }

  if (command === 'summary') {
    console.log(await generateCumulativeReport());
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function printHelp(): void {
  console.log(`Usage: mvt <command> [options]\n\nCommands:\n  run <path>\n  status\n  approve <gate>\n  report\n  launch\n  kill\n  verdict\n  cost\n  resume <path>\n  init [path]\n  deploy <target>`);
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
