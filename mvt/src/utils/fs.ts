import fs from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function writeFileAtomic(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, filePath);
}

export async function readJsonFile<T>(filePath: string, fallback?: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw.replace(/^\uFEFF/, '')) as T;
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await writeFileAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function appendLine(filePath: string, line: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.appendFile(filePath, `${line}\n`, 'utf8');
}

