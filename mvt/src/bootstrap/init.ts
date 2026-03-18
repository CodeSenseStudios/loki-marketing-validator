import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_CONFIG, ensureConfigFile, stringifyYamlLike } from '../utils/config.ts';
import { ensureDir, fileExists, writeFileAtomic, writeJsonFile } from '../utils/fs.ts';
import { REPO_ROOT, STATE_ROOT, MVT_ROOT } from '../utils/paths.ts';
import { nowIso } from '../utils/time.ts';

const CONTINUITY_TEMPLATE = `# MVT Continuity Log

## Current Phase
BOOTSTRAP

## Active Experiment
- Opportunity: (pending)
- Hypothesis: (pending)
- Start: (pending)
- End: (pending)

## Progress
- [ ] Phase 0: Bootstrap
- [ ] Phase 1: Brand & Identity
- [ ] Phase 2: Funnel Architecture
- [ ] Phase 3: Asset Creation
- [ ] Phase 4: Deployment
- [ ] Phase 5: Experiment Running
- [ ] Phase 6: Judgment

## Mistakes & Learnings
(none yet)

## Next Action
Parse Gap-Hunter input and populate experiment config.
`;

const EXPERIMENT_TEMPLATE = `# Experiment Protocol

- Hypothesis: pending
- Duration (days): 14
- Budget (USD): 500
- Success criteria:
  - Minimum signups: 100
  - Target CAC: 5
  - Minimum conversion rate: 3%
- Manual verification required:
  - Domain availability
  - Trademark review
  - Subreddit validation
  - Deployment credentials
`;

const PROVIDERS_TEMPLATE = {
  anthropic: {
    api_key: '${ANTHROPIC_API_KEY}',
    base_url: 'https://api.anthropic.com/v1/messages'
  },
  openai: {
    api_key: '${OPENAI_API_KEY}',
    base_url: 'https://api.openai.com/v1/chat/completions'
  }
};

const CIRCUIT_BREAKERS_TEMPLATE = {
  defaults: {
    failureThreshold: 5,
    cooldownSeconds: 300,
    halfOpenAfter: 60
  },
  overrides: {
    'orch-judge': {
      failureThreshold: 2,
      cooldownSeconds: 120
    }
  }
};

const DIRS = [
  'config',
  'state',
  'state/agents',
  'queue/pending',
  'queue/in-progress',
  'queue/completed',
  'queue/dead-letter',
  'memory/episodic',
  'memory/semantic',
  'memory/procedural',
  'agents',
  'swarms',
  'input',
  'input/data',
  'output/brand',
  'output/waitlist',
  'output/funnel',
  'output/ads',
  'output/outbound',
  'output/analytics',
  'output/verdict',
  'logs',
  'metrics'
] as const;

export interface InitOptions {
  gapHunterDir?: string;
  skipEnvValidation?: boolean;
}

export async function bootstrapProject(options: InitOptions = {}): Promise<void> {
  for (const dir of DIRS) {
    await ensureDir(path.join(STATE_ROOT, dir));
  }

  await ensureConfigFile(path.join(STATE_ROOT, 'config', 'config.yaml'), DEFAULT_CONFIG);
  await ensureConfigFile(path.join(STATE_ROOT, 'config', 'providers.yaml'), PROVIDERS_TEMPLATE);
  await ensureConfigFile(path.join(STATE_ROOT, 'config', 'circuit-breakers.yaml'), CIRCUIT_BREAKERS_TEMPLATE);
  await ensureFile(path.join(STATE_ROOT, 'CONTINUITY.md'), CONTINUITY_TEMPLATE);
  await ensureFile(path.join(STATE_ROOT, 'EXPERIMENT.md'), EXPERIMENT_TEMPLATE);
  await ensureFile(path.join(STATE_ROOT, 'state', 'STATUS.txt'), await buildStatusText());
  await ensureOrchestratorState();

  if (!options.skipEnvValidation) {
    validateEnvironment();
  }

  if (options.gapHunterDir) {
    await copyGapHunterInput(options.gapHunterDir);
  }
}

export function validateEnvironment(): void {
  const missing: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY && process.env.MVT_MOCK_MODE !== 'true') {
    missing.push('ANTHROPIC_API_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Set MVT_MOCK_MODE=true for local scaffolding.`
    );
  }
}

export async function copyGapHunterInput(sourceDir: string): Promise<void> {
  const files = ['opportunity.json', 'prd.md', 'financials.json', 'competitors.json'];
  for (const file of files) {
    const source = path.resolve(sourceDir, file);
    if (await fileExists(source)) {
      const raw = await fs.readFile(source, 'utf8');
      await writeFileAtomic(path.join(STATE_ROOT, 'input', file), raw);
    }
  }
}

export async function buildStatusText(): Promise<string> {
  const status = [
    'Phase: BOOTSTRAP',
    'Active agents: 0',
    'Queue pending: 0',
    'Queue in-progress: 0',
    'Queue completed: 0',
    'Queue dead-letter: 0',
    `Updated: ${nowIso()}`
  ];
  return `${status.join('\n')}\n`;
}

async function ensureFile(filePath: string, content: string): Promise<void> {
  if (!(await fileExists(filePath))) {
    await writeFileAtomic(filePath, content);
  }
}

async function ensureOrchestratorState(): Promise<void> {
  const orchestratorPath = path.join(STATE_ROOT, 'state', 'orchestrator.json');
  if (!(await fileExists(orchestratorPath))) {
    await writeJsonFile(orchestratorPath, {
      phase: 'BOOTSTRAP',
      started_at: nowIso(),
      updated_at: nowIso(),
      budget_spent: 0,
      budget_total: DEFAULT_CONFIG.experiment.budget_usd,
      active_agents: [],
      completed_swarms: [],
      approvals: {}
    });
  }
}

export async function writeShellWrapper(filePath: string, command: string): Promise<void> {
  await writeFileAtomic(filePath, `#!/usr/bin/env bash\nset -euo pipefail\n${command}\n`);
}

export async function scaffoldScripts(): Promise<void> {
  await ensureDir(path.join(MVT_ROOT, 'scripts'));
  await writeShellWrapper(
    path.join(MVT_ROOT, 'scripts', 'init.sh'),
    'node --experimental-strip-types ./src/cli.ts init "$@"'
  );
  await writeShellWrapper(
    path.join(MVT_ROOT, 'scripts', 'deploy-vercel.sh'),
    'node --experimental-strip-types ./src/cli.ts deploy vercel "$@"'
  );
  await writeShellWrapper(
    path.join(MVT_ROOT, 'scripts', 'deploy-github-pages.sh'),
    'node --experimental-strip-types ./src/cli.ts deploy github-pages "$@"'
  );
}

export async function ensureRepoMarker(): Promise<void> {
  const markerPath = path.join(REPO_ROOT, 'tasks', 'developed', 'TASK-01-BOOTSTRAP.md');
  if (!(await fileExists(markerPath))) {
    await writeFileAtomic(markerPath, '# TASK-01\n\nBootstrap files created.\n');
  }
}

export async function initAll(options: InitOptions = {}): Promise<void> {
  await bootstrapProject(options);
  await scaffoldScripts();
  await ensureRepoMarker();
  await writeFileAtomic(path.join(STATE_ROOT, 'config', 'README.yaml'), stringifyYamlLike({
    note: 'These .yaml files are stored as JSON-compatible YAML to avoid extra parser dependencies.'
  }));
}
