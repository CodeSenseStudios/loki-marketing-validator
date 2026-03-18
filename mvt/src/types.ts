export type ModelTier =
  | 'orchestrator'
  | 'strategy'
  | 'content'
  | 'data'
  | 'bulk_copy'
  | 'judgment';

export interface ExperimentBrief {
  opportunity_name: string;
  opportunity_score: number;
  target_industries: string[];
  target_audience: {
    persona: string;
    pain_points: string[];
    current_solutions: string[];
    willingness_to_pay_range: { min: number; max: number };
  };
  product_name: string;
  one_liner: string;
  key_features: string[];
  differentiators: string[];
  target_mrr: number;
  target_price_point: number;
  cac_budget: number;
  payback_months: number;
  competitors: Array<{
    name: string;
    positioning: string;
    pricing: string;
    weaknesses: string[];
  }>;
  experiment_hypothesis: string;
  success_criteria: {
    min_signups: number;
    max_cac: number;
    min_conversion_rate: number;
    experiment_duration_days: number;
  };
}

export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface Task {
  id: string;
  type: string;
  swarm: string;
  phase: number;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_agent: string | null;
  model_tier: ModelTier;
  title: string;
  description: string;
  inputs: string[];
  expected_outputs: string[];
  acceptance_criteria: string[];
  depends_on: string[];
  blocks: string[];
  retry_count: number;
  max_retries: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_log: string[];
  tokens_used: number;
  cost_usd: number;
  metadata?: Record<string, unknown>;
}

export interface RARVConfig {
  agent_type: string;
  task_id: string;
  task_file: string;
  agent_definition: string;
  model_tier: ModelTier;
  max_retries: number;
  continuity_path: string;
}

export interface RARVResult {
  status: 'completed' | 'failed' | 'retry';
  outputs: string[];
  tokens_used: number;
  errors: string[];
  retry_count: number;
  reflection?: string;
}

export interface ModelCall {
  system_prompt: string;
  user_prompt: string;
  model_tier: ModelTier;
  max_tokens?: number;
  temperature?: number;
  response_format?: 'text' | 'json';
  agent_type?: string;
  task_id?: string;
}

export interface ModelResponse {
  content: string;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
  provider: string;
}

export interface ExperimentStatus {
  day: number;
  total_days: number;
  signups: number;
  target_signups: number;
  cac: number;
  target_cac: number;
  budget_spent: number;
  budget_total: number;
  interview_score: number;
  status: 'running' | 'early_success' | 'early_kill' | 'completed';
  recommendation: string;
}

export interface SwarmDefinition {
  name: string;
  phase: number;
  agents: string[];
  dependencies: string[];
  parallel: boolean;
  completion_criteria: string[];
}

export interface AgentDefinition {
  name: string;
  type: string;
  swarm: string;
  model_tier: ModelTier;
  tools: string[];
  mission: string;
  inputs: string[];
  outputs: string[];
  criticalRules: string[];
  successMetrics: string[];
  identity: string;
}
