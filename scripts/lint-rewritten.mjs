#!/usr/bin/env node
// Fails when a skill listed in scripts/rewritten.json contains Cursor wording again.
// Usage: node scripts/lint-rewritten.mjs

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PRODUCT_PATTERNS, isProductFree, trackedFiles } from './product-patterns.mjs'

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const { paths } = JSON.parse(readFileSync(join(root, 'scripts/rewritten.json'), 'utf8'))

// The generator's references describe Orca's catalog, which lists a `cursor` agent product and full Claude model ids.
const CATALOG = ['skills/create-model-selection-skill/references/']

// The claude-code adapter names its own `Agent` tool fields (`subagent_type`, `run_in_background`).
const CLAUDE_CODE_ADAPTER = ['skills/resolve-capability/adapters/claude-code/']
// The orca adapter lists Orca's `cursor` agent id.
const ORCA_ADAPTER = ['skills/resolve-capability/adapters/orca/']

const BANNED = [
  [/\bcursor/i, 'the word Cursor', [...CATALOG, ...ORCA_ADAPTER]],
  [/\.mdc\b/, '.mdc rule file'],
  [/\bAskQuestion\b/, 'AskQuestion'],
  [/`Task`|\bTask (tool|subagent|call)\b/, 'the Task tool'],
  [/agent-transcripts|cursor-team-kit|[Bb]ugbot/, 'a Cursor-only service'],
  [/environment: "cloud"|\bcloud agent/i, 'Cursor cloud agents'],
  [/\bsubagent_type\b|\bgeneralPurpose\b|\brun_in_background\b|\bcloud_base_branch\b|\breadonly: (true|false)/, 'a Cursor Task field', CLAUDE_CODE_ADAPTER],
  [/\bcreate-skill\b|todolist/, 'a Cursor-only skill or tool name'],
  [/\bgrok-[\d.]+-(max|xhigh|high|medium|low)\b|\bclaude-(opus|sonnet|haiku|fable)-\d/, 'a Cursor model slug', CATALOG],
  [/pstack-models|role lines?\b/, 'the retired role table'],
]

// A rewritten skill may keep a block of old wording between these markers while the skills it routes to are still being rewritten.
const TRANSITION = /<!-- transition:start -->[\s\S]*?<!-- transition:end -->/g

const hits = []
for (const file of trackedFiles(root, paths)) {
  const productFree = isProductFree(file)
  // The bundled TypeScript pages through GitHub's GraphQL with a `cursor`, which is not the product.
  const cursorRules = !file.endsWith('.ts')
  readFileSync(join(root, file), 'utf8')
    .replace(TRANSITION, (block) => block.replace(/[^\n]/g, ''))
    .split('\n')
    .forEach((text, i) => {
      if (productFree) for (const [re, why] of PRODUCT_PATTERNS) if (re.test(text)) hits.push(`${file}:${i + 1}  ${why} (name a capability instead): ${text.trim().slice(0, 100)}`)
      if (cursorRules) for (const [re, why, exempt = []] of BANNED) if (re.test(text) && !exempt.some((x) => file.startsWith(x))) hits.push(`${file}:${i + 1}  ${why}: ${text.trim().slice(0, 100)}`)
    })
}

if (hits.length) {
  console.error(`Cursor wording in rewritten skills (${hits.length}):`)
  for (const h of hits) console.error(`  ${h}`)
  process.exit(1)
}
console.log(`ok: ${paths.length} rewritten path(s) free of Cursor wording`)
