import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MVT_ROOT = path.resolve(__dirname, '..', '..');
export const REPO_ROOT = path.resolve(MVT_ROOT, '..');
export const STATE_ROOT = path.join(MVT_ROOT, '.mvt');
export const TASKS_ROOT = path.join(REPO_ROOT, 'tasks');
export const DEVELOPED_ROOT = path.join(TASKS_ROOT, 'developed');

export function resolveFromMvt(...parts: string[]): string {
  return path.join(MVT_ROOT, ...parts);
}

export function resolveFromState(...parts: string[]): string {
  return path.join(STATE_ROOT, ...parts);
}
