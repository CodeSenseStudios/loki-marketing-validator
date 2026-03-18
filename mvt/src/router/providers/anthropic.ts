import type { ModelCall, ModelResponse } from '../../types.ts';
import { estimateTokens } from './mock.ts';

export async function anthropicCall(
  request: ModelCall,
  model: string,
  apiKey: string,
  endpoint: string
): Promise<ModelResponse> {
  const started = Date.now();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: request.max_tokens ?? 1200,
      temperature: request.temperature ?? 0.2,
      system: request.system_prompt,
      messages: [{ role: 'user', content: request.user_prompt }]
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic request failed (${res.status}): ${body.slice(0, 500)}`);
  }

  const payload = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text = payload.content?.map((part) => part.text ?? '').join('\n').trim() ?? '';
  const inputTokens = payload.usage?.input_tokens ?? estimateTokens(`${request.system_prompt}\n${request.user_prompt}`);
  const outputTokens = payload.usage?.output_tokens ?? estimateTokens(text);

  return {
    content: text,
    model_used: model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: calculateAnthropicCost(model, inputTokens, outputTokens),
    latency_ms: Date.now() - started,
    provider: 'anthropic'
  };
}

function getAnthropicPricing(model: string): { input: number; output: number } {
  if (model.includes('haiku')) {
    return { input: 0.25 / 1_000_000, output: 1.25 / 1_000_000 };
  }
  return { input: 3 / 1_000_000, output: 15 / 1_000_000 };
}

function calculateAnthropicCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = getAnthropicPricing(model);
  return Number((inputTokens * pricing.input + outputTokens * pricing.output).toFixed(6));
}
