import type { ModelCall, ModelResponse } from '../../types.ts';

export async function mockCall(request: ModelCall, resolvedModel: string): Promise<ModelResponse> {
  const inputTokens = estimateTokens(`${request.system_prompt}\n${request.user_prompt}`);
  const content = buildMockContent(request);

  return {
    content,
    model_used: resolvedModel,
    input_tokens: inputTokens,
    output_tokens: estimateTokens(content),
    cost_usd: 0,
    latency_ms: 1,
    provider: 'mock'
  };
}

export function estimateTokens(input: string): number {
  return Math.max(1, Math.ceil(input.length / 4));
}

function buildMockContent(request: ModelCall): string {
  if (request.system_prompt.includes('Evaluate whether the acceptance criterion')) {
    return 'YES - Mock mode treats acceptance criteria as satisfied when output files exist.';
  }
  if (request.system_prompt.includes('Reflect on the task output')) {
    return 'The output covered the required sections and is ready for manual refinement if needed.';
  }
  if (request.response_format === 'json') {
    return JSON.stringify(
      {
        summary: request.user_prompt.slice(0, 200),
        notes: ['Generated in mock mode']
      },
      null,
      2
    );
  }
  return `MOCK RESPONSE (${request.model_tier}): ${request.user_prompt.slice(0, 400)}`;
}
