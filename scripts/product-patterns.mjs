// The lines that name an agent product, a harness tool, or a product path.
// lint-rewritten.mjs bans them in PRODUCT_FREE paths, and check-ownership.mjs counts them.

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export const PRODUCT_PATTERNS = [
  [/\b(spawn_agent|spawn_subagent|AskUserQuestion|TodoWrite|update_plan|run_in_background|subagent_type|skill-creator|SendMessage|TaskStop|CronCreate|ScheduleWakeup|worker-(start|show|read|stop|release))\b/, 'a harness tool or Orca command'],
  [/(?<!pstack-)\borca\b|\bORCA_/i, 'Orca'],
  [/\bClaude\b|\bCodex\b|\bGrok\b/i, 'an agent product'],
  [/`(Agent|Explore|Plan)`|\bAgent tool\b/, 'a harness tool'],
  [/\.(claude|grok)\/|\bCLAUDE\.md\b|\bAGENTS\.md\b|\$CLAUDE_CONFIG_DIR|\$CODEX_HOME|~\/\.(claude|codex|grok)\b/, 'a product path'],
]

export const CONTRACT = 'skills/resolve-capability/'
export const ADAPTERS = 'skills/resolve-capability/adapters/'

// The stub keeps old links to the Orca worker reference alive until phase 3 regenerates select-model.
export const TRANSITIONAL = new Set(['skills/resolve-capability/references/orca-workers.md'])

// Phase 3 of docs/harness-adapters-design.md moves the generator's product facts into the adapters' Survey sections.
export const GENERATOR = 'skills/create-model-selection-skill/'

// All of skills/ outside the adapters and the generator. The repository's own name, pstack-orca, is not a product name.
export const PRODUCT_FREE = ['skills/']

export const inProductScope = (file) => PRODUCT_FREE.some((x) => file.startsWith(x)) && !file.startsWith(GENERATOR)

export const isProductFree = (file) => inProductScope(file) && !file.startsWith(ADAPTERS) && !TRANSITIONAL.has(file)

export const TEXT_FILE = /\.(md|mjs|js|ts|sh|json|ya?ml|toml)$/

export function trackedFiles(root, pathspecs) {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', ...pathspecs], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter((f) => f && TEXT_FILE.test(f) && !f.includes('/node_modules/') && existsSync(join(root, f)))
}
