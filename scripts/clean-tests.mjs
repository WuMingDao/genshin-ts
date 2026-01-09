import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

function rmSafe(p) {
  fs.rmSync(p, { recursive: true, force: true })
}

function cleanGenerated() {
  const dir = path.join(repoRoot, 'tests', 'generated')
  if (!fs.existsSync(dir)) return

  const keep = new Set(['mismatch_only.literal.ts', 'mismatch_only.wire.ts'])
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (keep.has(ent.name)) continue
    rmSafe(path.join(dir, ent.name))
  }
}

function cleanEnumCases() {
  const dir = path.join(repoRoot, 'tests', 'enum_cases')
  if (!fs.existsSync(dir)) return

  const keep = new Set(['enum_nodes_second.ts', 'enum_enumerationsEqual_wired.ts'])
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (keep.has(ent.name)) continue
    rmSafe(path.join(dir, ent.name))
  }
}

cleanGenerated()
cleanEnumCases()
