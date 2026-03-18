import fs from 'node:fs/promises';
import path from 'node:path';
import { loadJsonYaml } from '../utils/config.ts';
import { fileExists, readJsonFile, writeJsonFile, writeFileAtomic } from '../utils/fs.ts';
import { STATE_ROOT } from '../utils/paths.ts';
import { nowIso } from '../utils/time.ts';
import { runAdsPipeline } from '../pipelines/ads.ts';
import { runBrandPipeline } from '../pipelines/brand.ts';
import { runFunnelPipeline } from '../pipelines/funnel.ts';
import { runOutboundPipeline } from '../pipelines/outbound.ts';

const ORCHESTRATOR_STATE = path.join(STATE_ROOT, 'state', 'orchestrator.json');

export async function runSwarm(name: string): Promise<void> {
  if (name === 'brand-identity') {
    await runBrandPipeline();
    return;
  }
  if (name === 'funnel-content') {
    await runFunnelPipeline();
    return;
  }
  if (name === 'paid-acquisition') {
    await runAdsPipeline();
    return;
  }
  if (name === 'outbound-validation') {
    await runOutboundPipeline();
    return;
  }
  throw new Error(`Unknown swarm: ${name}`);
}

export async function updateSwarmCompletion(name: string): Promise<void> {
  const state = await readJsonFile<Record<string, unknown>>(ORCHESTRATOR_STATE, {});
  const completed = new Set<string>((state.completed_swarms as string[] | undefined) ?? []);
  completed.add(name);
  state.completed_swarms = Array.from(completed);
  state.updated_at = nowIso();
  await writeJsonFile(ORCHESTRATOR_STATE, state);
}

export async function assertSwarmDependencies(name: string): Promise<void> {
  const swarmPath = path.join(STATE_ROOT, 'swarms', `${name}.yaml`);
  if (!(await fileExists(swarmPath))) {
    throw new Error(`Missing swarm definition: ${name}`);
  }
  const definition = await loadJsonYaml<{ dependencies: string[] }>(swarmPath);
  const state = await readJsonFile<Record<string, unknown>>(ORCHESTRATOR_STATE, {});
  const completed = new Set<string>((state.completed_swarms as string[] | undefined) ?? []);
  const missing = (definition.dependencies ?? []).filter((dependency) => !completed.has(dependency));
  if (missing.length > 0) {
    throw new Error(`Swarm ${name} is blocked by: ${missing.join(', ')}`);
  }
}

export async function writeHumanGate(gate: string, body: string): Promise<void> {
  await writeFileAtomic(path.join(STATE_ROOT, 'output', `${gate}.md`), body);
}

export async function setApproval(gate: string, approved: boolean): Promise<void> {
  const state = await readJsonFile<Record<string, any>>(ORCHESTRATOR_STATE, {});
  state.approvals = state.approvals ?? {};
  state.approvals[gate] = { approved, updated_at: nowIso() };
  state.updated_at = nowIso();
  await writeJsonFile(ORCHESTRATOR_STATE, state);
}

export async function requireApproval(gate: string): Promise<void> {
  if (process.env.MVT_AUTO_APPROVE === 'true' || process.env.MVT_MOCK_MODE === 'true') {
    await setApproval(gate, true);
    return;
  }
  const state = await readJsonFile<Record<string, any>>(ORCHESTRATOR_STATE, {});
  const approved = state.approvals?.[gate]?.approved;
  if (!approved) {
    throw new Error(`Gate ${gate} requires approval. Run mvt approve ${gate}.`);
  }
}

export async function updatePhase(phase: string): Promise<void> {
  const state = await readJsonFile<Record<string, unknown>>(ORCHESTRATOR_STATE, {});
  state.phase = phase;
  state.updated_at = nowIso();
  await writeJsonFile(ORCHESTRATOR_STATE, state);
}

export async function listCompletedSwarms(): Promise<string[]> {
  const state = await readJsonFile<Record<string, any>>(ORCHESTRATOR_STATE, {});
  return state.completed_swarms ?? [];
}
