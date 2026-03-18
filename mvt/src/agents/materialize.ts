import path from 'node:path';
import { stringifyYamlLike } from '../utils/config.ts';
import { writeFileAtomic } from '../utils/fs.ts';
import { STATE_ROOT } from '../utils/paths.ts';
import { AGENT_DEFINITIONS, SWARM_DEFINITIONS } from './catalog.ts';

function renderAgentMarkdown(agent: typeof AGENT_DEFINITIONS[number]): string {
  return `---
name: ${agent.name}
type: ${agent.type}
swarm: ${agent.swarm}
model_tier: ${agent.model_tier}
tools: [${agent.tools.join(', ')}]
---

# ${agent.name}

## RARV Protocol
1. **REASON**: Read .mvt/CONTINUITY.md and your task file.
2. **ACT**: Produce the required artifacts in the specified output paths.
3. **REFLECT**: Record what worked, what did not, and what needs manual verification.
4. **VERIFY**: Check acceptance criteria before marking the task complete.

## Memory Protocol
- Write episodic memory to .mvt/memory/episodic/.
- Read prior learnings from .mvt/memory/semantic/.
- Store reusable patterns in .mvt/memory/procedural/.

## Identity
${agent.identity}

## Core Mission
${agent.mission}

## Inputs
${agent.inputs.map((item) => `- ${item}`).join('\n')}

## Outputs
${agent.outputs.map((item) => `- ${item}`).join('\n')}

## Critical Rules
${agent.criticalRules.map((item) => `- ${item}`).join('\n')}

## Success Metrics
${agent.successMetrics.map((item) => `- ${item}`).join('\n')}
`;
}

export async function materializeAgentAssets(): Promise<void> {
  for (const agent of AGENT_DEFINITIONS) {
    await writeFileAtomic(path.join(STATE_ROOT, 'agents', `${agent.type}.md`), renderAgentMarkdown(agent));
  }

  for (const swarm of SWARM_DEFINITIONS) {
    await writeFileAtomic(path.join(STATE_ROOT, 'swarms', `${swarm.name}.yaml`), stringifyYamlLike(swarm));
  }
}
