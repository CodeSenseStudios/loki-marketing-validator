import type { ModelCall, ModelResponse } from '../../types.ts';
import { estimateTokens } from './mock.ts';

export async function openAiCall(
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
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.max_tokens ?? 1000,
      messages: [
        { role: 'system', content: request.system_prompt },
        { role: 'user', content: request.user_prompt }
      ],
      response_format: request.response_format === 'json' ? { type: 'json_object' } : undefined
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI request failed (${res.status}): ${body.slice(0, 500)}`);
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const text = payload.choices?.[0]?.message?.content?.trim() ?? '';
  const inputTokens = payload.usage?.prompt_tokens ?? estimateTokens(`${request.system_prompt}\n${request.user_prompt}`);
  const outputTokens = payload.usage?.completion_tokens ?? estimateTokens(text);

  return {
    content: text,
    model_used: model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: calculateMiniCost(inputTokens, outputTokens),
    latency_ms: Date.now() - started,
    provider: 'openai'
  };
}

function calculateMiniCost(inputTokens: number, outputTokens: number): number {
  const inputCostPerToken = 0.15 / 1_000_000;
  const outputCostPerToken = 0.6 / 1_000_000;
  return Number((inputTokens * inputCostPerToken + outputTokens * outputCostPerToken).toFixed(6));
}
