import fs from 'node:fs/promises';
import { fileExists, writeFileAtomic } from './fs.ts';

export interface MvtConfig {
  experiment: {
    duration_days: number;
    budget_usd: number;
    min_signups_for_go: number;
    target_cac: number;
    hypothesis: string;
  };
  models: Record<string, string>;
  providers: Record<string, { api_key: string }>;
  retry: {
    max_retries: number;
    base_wait_seconds: number;
    max_wait_seconds: number;
  };
  tracking: {
    token_budget_warn_pct: number;
    token_budget_hard_limit_usd: number;
  };
}

export const DEFAULT_CONFIG: MvtConfig = {
  experiment: {
    duration_days: 14,
    budget_usd: 500,
    min_signups_for_go: 100,
    target_cac: 5,
    hypothesis: ''
  },
  models: {
    orchestrator: 'claude-sonnet-4-6',
    strategy: 'claude-sonnet-4-6',
    content: 'claude-haiku-4-5-20251001',
    data: 'claude-haiku-4-5-20251001',
    bulk_copy: 'gpt-4o-mini',
    judgment: 'claude-sonnet-4-6'
  },
  providers: {
    anthropic: { api_key: '${ANTHROPIC_API_KEY}' },
    openai: { api_key: '${OPENAI_API_KEY}' }
  },
  retry: {
    max_retries: 5,
    base_wait_seconds: 30,
    max_wait_seconds: 300
  },
  tracking: {
    token_budget_warn_pct: 80,
    token_budget_hard_limit_usd: 50
  }
};

export function stringifyYamlLike(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function loadJsonYaml<T>(filePath: string, fallback?: T): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  const normalized = raw.replace(/^\uFEFF/, '');
  try {
    return JSON.parse(normalized) as T;
  } catch {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Unable to parse config file ${filePath}. Expected JSON-compatible YAML.`);
  }
}

export async function ensureConfigFile(filePath: string, value: unknown): Promise<void> {
  if (!(await fileExists(filePath))) {
    await writeFileAtomic(filePath, stringifyYamlLike(value));
  }
}
