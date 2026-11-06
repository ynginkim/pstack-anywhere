#!/usr/bin/env node
// Fails when a product's tokens appear outside its adapter, when adapters link to each other,
// or when an adapter's headings leave the contract's vocabulary or exact steps.
// --report prints where product names sit under skills/ instead. --ref <commit> reads that commit.
// Usage: node scripts/check-ownership.mjs [--report] [--ref <commit>]

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ADAPTERS, CONTRACT, PRODUCT_FREE, PRODUCT_PATTERNS, TEXT_FILE, trackedFiles } from './product-patterns.mjs'

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const args = process.argv.slice(2)
const ref = args.includes('--ref') ? args[args.indexOf('--ref') + 1] : null

const files = ref
  ? execFileSync('git', ['ls-tree', '-r', '--name-only', ref, '--', 'skills'], { cwd: root, encoding: 'utf8' })
      .split('\n')
      .filter((f) => f && TEXT_FILE.test(f) && !f.includes('/node_modules/'))
  : trackedFiles(root, ['skills'])
const read = (f) => (ref ? execFileSync('git', ['show', `${ref}:${f}`], { cwd: root, encoding: 'utf8' }) : readFileSync(join(root, f), 'utf8'))
const lines = new Map(files.map((f) => [f, read(f).split('\n')]))

// The stub keeps old links to the Orca worker reference alive until phase 3 regenerates select-model.
const TRANSITIONAL = new Set(['skills/resolve-capability/references/orca-workers.md'])

const ORCA = PRODUCT_PATTERNS.find(([, why]) => why === 'Orca')[0]
const SCOPES = ['own harness', 'every harness', 'target product', 'contract']
const POINTER = /If an environment adapter that `detect\.sh` printed has an exact step with this heading/

if (args.includes('--report')) report()
else check()

function report() {
  const area = (f) =>
    f.startsWith(ADAPTERS) ? `adapters/${f.slice(ADAPTERS.length).split('/')[0]}`
    : f.startsWith(CONTRACT) ? 'contract (resolve-capability)'
    : f.startsWith('skills/create-model-selection-skill/') ? 'generator'
    : 'rest of skills/'
  const rows = new Map()
  const perFile = []
  for (const [f, text] of lines) {
    const named = text.filter((t) => PRODUCT_PATTERNS.some(([re]) => re.test(t))).length
    if (!named) continue
    const orca = text.filter((t) => ORCA.test(t)).length
    const r = rows.get(area(f)) ?? { files: 0, named: 0, orca: 0 }
    rows.set(area(f), { files: r.files + 1, named: r.named + named, orca: r.orca + orca })
    perFile.push([named, orca, f])
  }
  console.log(`Product names under skills/ at ${ref ?? 'the working tree'}\n`)
  console.log('| Area | Files | Lines | Of those, lines that name Orca |\n| --- | --- | --- | --- |')
  for (const [a, r] of [...rows].sort()) console.log(`| ${a} | ${r.files} | ${r.named} | ${r.orca} |`)
  console.log('')
  for (const [n, o, f] of perFile.sort((a, b) => a[2].localeCompare(b[2]))) console.log(`${String(n).padStart(4)} ${String(o).padStart(4)}  ${f}`)
}

function check() {
  const problems = []
  const adapters = parseAdapters(problems)
  if (!adapters.length) return console.log('ok: no adapters yet, nothing to check')

  const owners = new Map()
  for (const a of adapters) for (const t of a.owns) owners.set(t.key, [...(owners.get(t.key) ?? []), a])

  const inScope = (f) => f.startsWith(CONTRACT) || PRODUCT_FREE.some((x) => f.startsWith(x))
  let scanned = 0
  for (const [f, text] of lines) {
    if (!inScope(f) || TRANSITIONAL.has(f)) continue
    scanned++
    const home = adapters.find((a) => f.startsWith(a.dir))
    const launching = home?.kind === 'environment' && f === home.file ? sectionLines(text, 'Launching harnesses') : new Set()
    text.forEach((t, i) => {
      for (const [key, owning] of owners) {
        if (!owning[0].tokens.get(key).test(t)) continue
        if (home && owning.includes(home)) continue
        if (launching.has(i) && owning.every((a) => a.kind === 'harness')) continue
        problems.push(`${f}:${i + 1}  names ${owning[0].tokens.get(key).source}, which only ${owning.map((a) => a.id).join(' and ')} may name`)
      }
      if (home) {
        for (const other of adapters) {
          if (other === home) continue
          if (new RegExp(`adapters/${other.id}\\b|\\.\\./${other.id}/`).test(t)) problems.push(`${f}:${i + 1}  links into adapters/${other.id}/`)
        }
      }
    })
  }

  const vocab = parseVocabulary(problems)
  const exact = parseExactSteps()
  let headings = 0
  for (const a of adapters) {
    const text = lines.get(a.file)
    for (const [i, name] of subheadings(text, 'Capabilities')) {
      headings++
      if (!vocab.has(name)) problems.push(`${a.file}:${i + 1}  \`${name}\` is not a capability in ${CONTRACT}SKILL.md`)
      if (a.kind === 'environment' && !/^(Overrides|Adds to)\./.test(firstBodyLine(text, i))) problems.push(`${a.file}:${i + 1}  an environment heading starts with "Overrides." or "Adds to."`)
    }
    for (const [i, name] of subheadings(text, 'Exact steps')) {
      if (name.startsWith('New.')) continue
      if (!exact.has(name)) problems.push(`${a.file}:${i + 1}  exact step "${name}" matches no heading in ${CONTRACT}references/exact-steps.md`)
      else if (!exact.get(name)) problems.push(`${CONTRACT}references/exact-steps.md  "${name}" lacks the sentence that points to an environment's step`)
    }
    if (a.kind === 'environment' && !lines.has(`${a.dir}detect.sh`)) problems.push(`${a.dir}  an environment adapter needs detect.sh`)
  }

  if (problems.length) {
    console.error(`Ownership check failed (${problems.length}):`)
    for (const p of problems) console.error(`  ${p}`)
    process.exit(1)
  }
  console.log(`ok: ${adapters.length} adapters, ${scanned} files in scope, ${headings} capability headings, ${vocab.size} capabilities`)
}

function parseAdapters(problems) {
  const out = []
  for (const file of files.filter((f) => f.startsWith(ADAPTERS) && /^[^/]+\/adapter\.md$/.test(f.slice(ADAPTERS.length)))) {
    const id = file.slice(ADAPTERS.length).split('/')[0]
    const head = /^---\n([\s\S]*?)\n---/.exec(lines.get(file).join('\n'))?.[1] ?? ''
    const kind = /^kind:\s*(\S+)/m.exec(head)?.[1]
    const owns = (/^owns:\s*\[(.*)\]/m.exec(head)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    if (kind !== 'harness' && kind !== 'environment') problems.push(`${file}  kind is harness or environment`)
    if (!owns.length) problems.push(`${file}  owns lists no token`)
    const tokens = new Map(owns.map((t) => [t.toLowerCase(), /^[A-Za-z]+$/.test(t) ? new RegExp(`\\b${t}\\b`, 'i') : new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))]))
    out.push({ id, kind, file, dir: `${ADAPTERS}${id}/`, tokens, owns: [...tokens.keys()].map((key) => ({ key })) })
  }
  return out
}

function parseVocabulary(problems) {
  const vocab = new Map()
  const file = `${CONTRACT}SKILL.md`
  for (const [i, t] of (lines.get(file) ?? []).entries()) {
    const m = /^- `([a-z-]+)` \(([a-z ]+)\): (.*)$/.exec(t)
    if (!m) continue
    if (!SCOPES.includes(m[2])) problems.push(`${file}:${i + 1}  scope "${m[2]}" is not one of ${SCOPES.join(', ')}`)
    if (!/Fallback: |No fallback is needed\./.test(m[3])) problems.push(`${file}:${i + 1}  \`${m[1]}\` has no fallback`)
    vocab.set(m[1], m[2])
  }
  if (!vocab.size) problems.push(`${file}  has no capability index`)
  return vocab
}

function parseExactSteps() {
  const text = lines.get(`${CONTRACT}references/exact-steps.md`) ?? []
  const out = new Map()
  let name = null
  for (const t of text) {
    const h = /^## (.+)$/.exec(t)
    if (h) out.set((name = h[1]), false)
    else if (name && POINTER.test(t)) out.set(name, true)
  }
  return out
}

function sectionLines(text, title) {
  const out = new Set()
  let inside = false
  text.forEach((t, i) => {
    if (/^## /.test(t)) inside = t === `## ${title}`
    if (inside) out.add(i)
  })
  return out
}

function subheadings(text, section) {
  const inside = sectionLines(text, section)
  return text.flatMap((t, i) => {
    const m = inside.has(i) && /^### (?:`([a-z-]+)`|(.+))$/.exec(t)
    return m ? [[i, m[1] ?? m[2]]] : []
  })
}

function firstBodyLine(text, i) {
  return text.slice(i + 1).find((t) => t.trim()) ?? ''
}
