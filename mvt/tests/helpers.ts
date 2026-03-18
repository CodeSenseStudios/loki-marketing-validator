import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATE_ROOT } from '../src/utils/paths.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function fixtureDir(name: string): string {
  return path.join(__dirname, 'fixtures', name);
}

export async function resetState(): Promise<void> {
  await fs.rm(STATE_ROOT, { recursive: true, force: true });
}
