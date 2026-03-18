import fs from 'node:fs/promises';
import path from 'node:path';
import { fileExists, writeFileAtomic } from '../utils/fs.ts';
import { STATE_ROOT } from '../utils/paths.ts';
import { nowIso } from '../utils/time.ts';

const BUCKETS = ['pending', 'in-progress', 'completed', 'dead-letter'] as const;

export async function updateStatusFile(phase: string, activeAgents: string[] = []): Promise<void> {
  const counts: Record<string, number> = {};
  for (const bucket of BUCKETS) {
    const dir = path.join(STATE_ROOT, 'queue', bucket);
    counts[bucket] = await countJsonFiles(dir);
  }

  const content = [
    `Phase: ${phase}`,
    `Active agents: ${activeAgents.length ? activeAgents.join(', ') : '0'}`,
    `Queue pending: ${counts.pending}`,
    `Queue in-progress: ${counts['in-progress']}`,
    `Queue completed: ${counts.completed}`,
    `Queue dead-letter: ${counts['dead-letter']}`,
    `Updated: ${nowIso()}`
  ].join('\n');

  await writeFileAtomic(path.join(STATE_ROOT, 'state', 'STATUS.txt'), `${content}\n`);
}

async function countJsonFiles(dir: string): Promise<number> {
  if (!(await fileExists(dir))) {
    return 0;
  }
  const entries = await fs.readdir(dir);
  return entries.filter((entry) => entry.endsWith('.json')).length;
}
