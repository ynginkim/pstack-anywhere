#!/usr/bin/env node
// Checks that every hedge on a mechanism in resolve-capability at <old ref> still sits next to that
// mechanism in the working tree, so a move cannot turn an unverified claim into a plain one.
// Usage: node scripts/audit-adapter-move.mjs <old ref>

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONTRACT, trackedFiles } from './product-patterns.mjs'

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const ref = process.argv[2]
if (!ref) {
  console.error('usage: node scripts/audit-adapter-move.mjs <old ref>')
  process.exit(2)
}

const HEDGES = [
  ['unverified', /\bunverified\b/i],
  ['not run', /\bnot (?:been )?(?:run|tested|verified)\b|\bwere not run\b|\bwas not run\b|\bhas not run\b/i],
  ['help text read', /\bhelp text (?:was )?read\b/i],
  ['documented', /\bdocumented\b/i],
]

const sentences = (file, text) =>
  text.split('\n').flatMap((line, i) =>
    line.split(/(?<=[.)])\s+(?=[A-Z`(])/).map((s) => ({ file, line: i + 1, text: s })),
  )
const hedgesOf = (s) => HEDGES.filter(([, re]) => re.test(s)).map(([name]) => name)
const ticks = (s) => [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1])
const words = (s) => new Set(s.toLowerCase().match(/[a-z][a-z-]{5,}/g) ?? [])

const oldFiles = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, '--', CONTRACT], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter((f) => f.endsWith('.md'))
const old = oldFiles.flatMap((f) => sentences(f, execFileSync('git', ['show', `${ref}:${f}`], { cwd: root, encoding: 'utf8' })))
const now = trackedFiles(root, [CONTRACT])
  .filter((f) => f.endsWith('.md'))
  .flatMap((f) => sentences(f, readFileSync(join(root, f), 'utf8')))

let hedged = 0
const missing = []
const found = []
for (const s of old) {
  const kinds = hedgesOf(s.text)
  if (!kinds.length) continue
  hedged++
  const keys = ticks(s.text)
  const product = /references\/([a-z-]+?)(?:-workers)?\.md$/.exec(s.file)?.[1]
  const home = `${CONTRACT}adapters/${product}/`
  const candidates = [...now.filter((n) => n.file.startsWith(home)), ...now.filter((n) => !n.file.startsWith(home))]
  const exact = candidates.find((n) => n.text.replace(/^- /, '').trim() === s.text.replace(/^- /, '').trim())
  const match = exact ?? candidates.find((n) => {
    if (!kinds.every((k) => hedgesOf(n.text).includes(k))) return false
    if (keys.length) return keys.every((k) => n.text.includes(k))
    const w = words(s.text)
    const shared = [...words(n.text)].filter((x) => w.has(x)).length
    return shared >= Math.ceil(w.size * 0.6)
  })
  if (match) found.push([s, match])
  else missing.push(s)
}

console.log(`Hedged sentences in ${CONTRACT} at ${ref}: ${hedged}. Still hedged next to the same mechanism: ${found.length}. Missing: ${missing.length}.\n`)
for (const [s, n] of found) console.log(`ok       ${s.file}:${s.line} -> ${n.file}:${n.line}  [${hedgesOf(s.text).join(', ')}] ${ticks(s.text).slice(0, 3).join(' ')}`)
for (const s of missing) console.log(`MISSING  ${s.file}:${s.line}  [${hedgesOf(s.text).join(', ')}] ${s.text.slice(0, 120)}`)
process.exit(missing.length ? 1 : 0)
