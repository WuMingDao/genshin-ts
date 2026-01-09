import fs from 'node:fs'
import path from 'node:path'

import type { Mode } from './values.js'

export type GeneratedCall = {
  fn: string
  typeCase?: string
  code: string
}

export function writeText(p: string, text: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, text, 'utf8')
}

export function cleanDir(dir: string) {
  const keep = new Set([
    'mismatch_only.literal.ts',
    'mismatch_only.wire.ts',
    'enum_nodes_second.ts'
  ])
  if (fs.existsSync(dir)) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.isFile() && keep.has(ent.name)) continue
      fs.rmSync(path.join(dir, ent.name), { recursive: true, force: true })
    }
  }
  fs.mkdirSync(dir, { recursive: true })
}

export function header(mode: Mode, title: string, graphId: number): string {
  return [
    `import { g } from 'genshin-ts/runtime/core'`,
    `import { configId, faction, guid, prefabId } from 'genshin-ts/runtime/value'`,
    `import * as E from 'genshin-ts/definitions/enum'`,
    ``,
    `// AUTO-GENERATED: ${title} (${mode})`,
    `// Run: npx tsx scripts/generate-node-gia-tests.ts`,
    ``,
    `g.server({ id: ${graphId} }).on('whenEntityIsCreated', (_evt, f) => {`
  ].join('\n')
}

export function footer(): string {
  return `})\n`
}

export function emitFile(
  mode: Mode,
  title: string,
  graphId: number,
  producers: string | null,
  calls: GeneratedCall[]
) {
  const lines: string[] = []
  lines.push(header(mode, title, graphId))
  if (producers) lines.push(producers)
  for (const c of calls) {
    if (c.typeCase) lines.push(`  // ${c.fn} :: ${c.typeCase}`)
    lines.push(`  ${c.code}`)
  }
  lines.push(footer())
  return lines.join('\n') + '\n'
}
