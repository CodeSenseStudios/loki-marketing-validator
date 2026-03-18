import fs from 'node:fs/promises';
import path from 'node:path';
import type { RARVConfig, RARVResult, Task } from '../types.ts';
import { failTask, getTaskStatus } from '../queue/queue.ts';
import { ModelRouter } from '../router/model-router.ts';
import { appendLine, fileExists, writeJsonFile } from '../utils/fs.ts';
import { extractSection } from '../utils/markdown.ts';
import { STATE_ROOT } from '../utils/paths.ts';
import { nowIso } from '../utils/time.ts';

export interface RarvExecutor {
  (task: Task): Promise<string[]>;
}

export class RarvEngine {
  router: ModelRouter;
  executors: Record<string, RarvExecutor>;

  constructor(router?: ModelRouter, executors: Record<string, RarvExecutor> = {}) {
    this.router = router ?? new ModelRouter();
    this.executors = executors;
  }

  async run(config: RARVConfig): Promise<RARVResult> {
    const task = await getTaskStatus(config.task_id);
    const errors: string[] = [];
    try {
      const reason = await this.reason(config, task);
      const outputs = await this.act(config, task, reason);
      const reflection = await this.reflect(config, task, outputs);
      const verify = await this.verify(config, task, outputs);

      if (verify.length > 0) {
        errors.push(...verify);
        await this.logLearning(config.agent_type, verify.join('; '));
        await failTask(task.id, verify.join('; '));
        return {
          status: task.retry_count + 1 >= config.max_retries ? 'failed' : 'retry',
          outputs,
          tokens_used: 0,
          errors,
          retry_count: task.retry_count + 1,
          reflection
        };
      }

      return {
        status: 'completed',
        outputs,
        tokens_used: 0,
        errors,
        retry_count: task.retry_count,
        reflection
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await failTask(task.id, message);
      return {
        status: 'failed',
        outputs: [],
        tokens_used: 0,
        errors: [message],
        retry_count: task.retry_count + 1
      };
    }
  }

  async reason(config: RARVConfig, task: Task): Promise<string> {
    const continuity = await fs.readFile(config.continuity_path, 'utf8');
    const learnings = extractSection(continuity, 'Mistakes & Learnings');
    const prompt = [
      `Task: ${task.title}`,
      `Description: ${task.description}`,
      `Acceptance: ${task.acceptance_criteria.join(' | ')}`,
      `Learnings: ${learnings || 'none'}`
    ].join('\n');

    const response = await this.router.call({
      system_prompt: 'You are planning the next action in a RARV cycle.',
      user_prompt: prompt,
      model_tier: config.model_tier,
      agent_type: config.agent_type,
      task_id: task.id
    });
    await appendLine(path.join(STATE_ROOT, 'logs', 'rarv.log'), `${nowIso()} REASON ${task.id}`);
    return response.content;
  }

  async act(config: RARVConfig, task: Task, reason: string): Promise<string[]> {
    const executor = this.executors[config.agent_type];
    if (executor) {
      const outputs = await executor(task);
      await appendLine(path.join(STATE_ROOT, 'logs', 'rarv.log'), `${nowIso()} ACT ${task.id}`);
      return outputs;
    }

    const response = await this.router.call({
      system_prompt: 'You are executing a deterministic MVT task.',
      user_prompt: `${reason}\n\nProduce outputs for: ${task.expected_outputs.join(', ')}`,
      model_tier: config.model_tier,
      agent_type: config.agent_type,
      task_id: task.id
    });

    const outputs: string[] = [];
    for (const outputPath of task.expected_outputs) {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, response.content, 'utf8');
      outputs.push(outputPath);
    }
    await appendLine(path.join(STATE_ROOT, 'logs', 'rarv.log'), `${nowIso()} ACT ${task.id}`);
    return outputs;
  }

  async reflect(config: RARVConfig, task: Task, outputs: string[]): Promise<string> {
    const response = await this.router.call({
      system_prompt: 'Reflect on the task output and capture concise learning.',
      user_prompt: `Task ${task.id} produced ${outputs.join(', ')}`,
      model_tier: config.model_tier,
      agent_type: config.agent_type,
      task_id: task.id
    });

    await appendLine(
      config.continuity_path,
      `\n### ${config.agent_type} (${task.id})\n- Reflection: ${response.content.trim()}\n`
    );
    await writeJsonFile(path.join(STATE_ROOT, 'memory', 'episodic', `${config.agent_type}-${Date.now()}.json`), {
      timestamp: nowIso(),
      task_id: task.id,
      reflection: response.content,
      outputs
    });
    return response.content;
  }

  async verify(config: RARVConfig, task: Task, outputs: string[]): Promise<string[]> {
    const issues: string[] = [];
    for (const outputPath of outputs) {
      if (!(await fileExists(outputPath))) {
        issues.push(`Missing output file: ${outputPath}`);
      }
    }
    for (const criterion of task.acceptance_criteria) {
      const response = await this.router.call({
        system_prompt: 'Evaluate whether the acceptance criterion appears satisfied. Reply YES or NO with a brief reason.',
        user_prompt: `Criterion: ${criterion}\nOutputs: ${outputs.join(', ')}`,
        model_tier: config.model_tier,
        agent_type: config.agent_type,
        task_id: task.id
      });
      if (!response.content.trim().toUpperCase().startsWith('YES')) {
        issues.push(`Criterion failed: ${criterion} :: ${response.content.trim()}`);
      }
    }
    await appendLine(path.join(STATE_ROOT, 'logs', 'rarv.log'), `${nowIso()} VERIFY ${task.id}`);
    return issues;
  }

  async logLearning(agentType: string, learning: string): Promise<void> {
    await appendLine(
      path.join(STATE_ROOT, 'memory', 'semantic', `${agentType}.jsonl`),
      JSON.stringify({
        timestamp: nowIso(),
        learning
      })
    );
  }
}
