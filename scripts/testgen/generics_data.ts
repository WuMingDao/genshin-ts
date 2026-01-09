import fs from 'node:fs'
import path from 'node:path'

export type GenericsRecord = {
  functionName: string
  genericParameters: string[]
  availableTypes: string[]
}

export type GenericsSummaryGroup = {
  id: number
  functionCount: number
  typeCount: number
  functions: string[]
  types: string[]
}

export function loadNodeGenerics(repoRoot: string): GenericsRecord[] {
  const p = path.join(repoRoot, 'resources/node_generics.json')
  return JSON.parse(fs.readFileSync(p, 'utf8')) as GenericsRecord[]
}

export function loadNodeGenericsSummary(repoRoot: string): GenericsSummaryGroup[] {
  const p = path.join(repoRoot, 'resources/node_generics_summary.json')
  return JSON.parse(fs.readFileSync(p, 'utf8')) as GenericsSummaryGroup[]
}

export function buildGenericsMap(list: GenericsRecord[]): Map<string, GenericsRecord> {
  const map = new Map<string, GenericsRecord>()
  for (const r of list) map.set(r.functionName, r)
  return map
}

export type GenericParamRef = { kind: 'input' | 'output'; index: number }

export function parseGenericParamRef(s: string): GenericParamRef | null {
  // "input[0]" / "output[1]"
  const m = /^(input|output)\[(\d+)\]$/.exec(s.trim())
  if (!m) return null
  const kind = m[1] === 'output' ? 'output' : 'input'
  return { kind, index: Number(m[2]) }
}
