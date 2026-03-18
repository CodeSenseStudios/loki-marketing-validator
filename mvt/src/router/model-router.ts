import path from 'node:path';
import { loadJsonYaml, type MvtConfig } from '../utils/config.ts';
import { appendLine, readJsonFile, writeJsonFile } from '../utils/fs.ts';
import { STATE_ROOT } from '../utils/paths.ts';
import { nowIso } from '../utils/time.ts';
import type { ModelCall, ModelResponse } from '../types.ts';
import { anthropicCall } from './providers/anthropic.ts';
import { mockCall, estimateTokens } from './providers/mock.ts';
import { openAiCall } from './providers/openai.ts';

interface CostSummary {
  total_usd: number;
  by_tier: Record<string, number>;
  by_agent: Record<string, number>;
}

export class ModelRouter {
  configPath = path.join(STATE_ROOT, 'config', 'config.yaml');
  providersPath = path.join(STATE_ROOT, 'config', 'providers.yaml');
  logPath = path.join(STATE_ROOT, 'metrics', 'model-calls.jsonl');
  summaryPath = path.join(STATE_ROOT, 'metrics', 'cost-summary.json');

  async resolveModel(tier: string): Promise<{ provider: string; model: string }> {
    const config = await this.loadConfig();
    const model = config.models[tier];
    if (!model) {
      throw new Error(`Unknown model tier: ${tier}`);
    }
    const provider = model.startsWith('gpt') ? 'openai' : 'anthropic';
    return { provider, model };
  }

  async call(request: ModelCall): Promise<ModelResponse> {
    const config = await this.loadConfig();
    const { provider, model } = await this.resolveModel(request.model_tier);
    const estimatedCost = estimateCallCost(model, request);
    if (estimatedCost > 2) {
      throw new Error(`Estimated single-call cost ${estimatedCost.toFixed(2)} exceeds $2 guardrail.`);
    }

    const summary = await this.getCostSummary();
    const hardLimit = config.tracking.token_budget_hard_limit_usd;
    const warnLimit = hardLimit * (config.tracking.token_budget_warn_pct / 100);
    if (summary.total_usd >= hardLimit && request.model_tier !== 'judgment') {
      throw new Error(`Hard token budget reached (${summary.total_usd.toFixed(2)} / ${hardLimit.toFixed(2)}).`);
    }

    const useMock = process.env.MVT_MOCK_MODE === 'true';
    const response = useMock ? await mockCall(request, model) : await this.callProvider(provider, model, request);

    if (summary.total_usd + response.cost_usd >= warnLimit) {
      await appendLine(path.join(STATE_ROOT, 'logs', 'budget-warnings.log'), `${nowIso()} soft limit warning`);
    }

    await this.logCall(request, response);
    return response;
  }

  async batchCall(requests: ModelCall[]): Promise<ModelResponse[]> {
    const responses: ModelResponse[] = [];
    for (const request of requests) {
      responses.push(await this.call(request));
    }
    return responses;
  }

  async getCostSummary(): Promise<CostSummary> {
    return readJsonFile<CostSummary>(this.summaryPath, {
      total_usd: 0,
      by_tier: {},
      by_agent: {}
    });
  }

  async callProvider(provider: string, model: string, request: ModelCall): Promise<ModelResponse> {
    const providers = await loadJsonYaml<Record<string, { api_key?: string; base_url?: string }>>(this.providersPath);
    const config = providers[provider];
    if (!config?.api_key || config.api_key.startsWith('${')) {
      throw new Error(`Provider ${provider} is not configured. Set credentials or use MVT_MOCK_MODE=true.`);
    }

    if (provider === 'openai') {
      return openAiCall(request, model, config.api_key, config.base_url ?? 'https://api.openai.com/v1/chat/completions');
    }

    return anthropicCall(request, model, config.api_key, config.base_url ?? 'https://api.anthropic.com/v1/messages');
  }

  async loadConfig(): Promise<MvtConfig> {
    return loadJsonYaml<MvtConfig>(this.configPath);
  }

  async logCall(request: ModelCall, response: ModelResponse): Promise<void> {
    const event = {
      timestamp: nowIso(),
      agent_type: request.agent_type ?? 'unknown',
      task_id: request.task_id ?? 'unknown',
      tier: request.model_tier,
      model: response.model_used,
      input_tokens: response.input_tokens,
      output_tokens: response.output_tokens,
      cost_usd: response.cost_usd,
      latency_ms: response.latency_ms,
      provider: response.provider
    };
    await appendLine(this.logPath, JSON.stringify(event));

    if (response.provider === 'mock') {
      return;
    }

    try {
      const summary = await this.getCostSummary();
      summary.total_usd = Number((summary.total_usd + response.cost_usd).toFixed(6));
      summary.by_tier[request.model_tier] = Number(
        ((summary.by_tier[request.model_tier] ?? 0) + response.cost_usd).toFixed(6)
      );
      const agentKey = request.agent_type ?? 'unknown';
      summary.by_agent[agentKey] = Number(((summary.by_agent[agentKey] ?? 0) + response.cost_usd).toFixed(6));
      await writeJsonFile(this.summaryPath, summary);
    } catch (error) {
      await appendLine(path.join(STATE_ROOT, 'logs', 'budget-warnings.log'), `${nowIso()} summary-write-skipped: ${String(error)}`);
    }
  }
}

function estimateCallCost(model: string, request: ModelCall): number {
  const inputTokens = estimateTokens(`${request.system_prompt}\n${request.user_prompt}`);
  const outputTokens = request.max_tokens ?? 1200;
  if (model.startsWith('gpt')) {
    return inputTokens * (0.15 / 1_000_000) + outputTokens * (0.6 / 1_000_000);
  }
  return inputTokens * (3 / 1_000_000) + outputTokens * (15 / 1_000_000);
}
