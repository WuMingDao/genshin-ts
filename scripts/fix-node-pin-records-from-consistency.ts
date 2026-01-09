import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

import { NODE_PIN_RECORDS } from '../src/thirdparty/Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/node_data/node_pin_records.js'

type Finding = {
  kind: string
  nodeType: string
  nodeId?: number
  expectedInputs?: number
  observedArgs?: number[]
}

type Report = {
  findings: Finding[]
}

function formatInputsInline(inputs: string[]) {
  return `[${inputs.map((s) => `'${s}'`).join(', ')}]`
}

function findNodePinRecordsArray(sf: ts.SourceFile): ts.ArrayLiteralExpression | null {
  let found: ts.ArrayLiteralExpression | null = null
  const unwrap = (e: ts.Expression): ts.Expression => {
    if (ts.isParenthesizedExpression(e)) return unwrap(e.expression)
    if (ts.isAsExpression(e)) return unwrap(e.expression)
    if (ts.isTypeAssertionExpression(e)) return unwrap(e.expression)
    // SatisfiesExpression: `expr satisfies T`
    if ((e as ts.Node).kind === (ts.SyntaxKind as unknown as { SatisfiesExpression?: number }).SatisfiesExpression) {
      return unwrap((e as any).expression as ts.Expression)
    }
    return e
  }
  const visit = (n: ts.Node) => {
    if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      n.name.text === 'NODE_PIN_RECORDS' &&
      n.initializer &&
      ts.isArrayLiteralExpression(unwrap(n.initializer))
    ) {
      found = unwrap(n.initializer) as ts.ArrayLiteralExpression
      return
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return found
}

function getProp(obj: ts.ObjectLiteralExpression, name: string): ts.PropertyAssignment | null {
  for (const p of obj.properties) {
    if (!ts.isPropertyAssignment(p)) continue
    if (ts.isIdentifier(p.name) && p.name.text === name) return p
    if (ts.isStringLiteral(p.name) && p.name.text === name) return p
  }
  return null
}

function getNumberLiteral(expr: ts.Expression): number | null {
  if (ts.isNumericLiteral(expr)) return Number(expr.text)
  return null
}

function main() {
  const repoRoot = process.cwd()
  const reportPath = path.join(repoRoot, 'tests/generated/_node_def_consistency.json')
  const pinRecordsPath = path.join(
    repoRoot,
    'src/thirdparty/Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/node_data/node_pin_records.ts'
  )

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as Report
  let src = fs.readFileSync(pinRecordsPath, 'utf8')
  const sf = ts.createSourceFile(pinRecordsPath, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const arr = findNodePinRecordsArray(sf)
  if (!arr) throw new Error('[error] failed to locate NODE_PIN_RECORDS array in node_pin_records.ts')

  // Only patch nodes that have nodeId and a single observed arg count
  const patches = report.findings
    .filter(
      (f) =>
        (f.kind === 'args_count_mismatch_nodes_more' || f.kind === 'args_count_mismatch_thirdparty_more') &&
        typeof f.nodeId === 'number' &&
        Array.isArray(f.observedArgs) &&
        f.observedArgs.length === 1
    )
    .map((f) => ({ nodeType: f.nodeType, nodeId: f.nodeId!, target: f.observedArgs![0]! }))

  // Build quick lookup for current record inputs
  const byId = new Map<number, string[]>()
  for (const r of NODE_PIN_RECORDS as Array<{ id: number; inputs: string[] }>) {
    byId.set(r.id, r.inputs ?? [])
  }

  let changed = 0
  const errors: Array<{ nodeId: number; why: string }> = []

  // Prepare text edits from AST ranges (apply from end to start)
  const want = new Map<number, string[]>()
  for (const p of patches) {
    const cur = byId.get(p.nodeId)
    if (!cur) continue
    if (cur.length === p.target) continue
    const nextInputs =
      cur.length < p.target
        ? [...cur, ...Array.from({ length: p.target - cur.length }, () => 'R<T>')]
        : cur.slice(0, p.target)
    want.set(p.nodeId, nextInputs)
  }

  const edits: Array<{ start: number; end: number; text: string; nodeId: number }> = []
  for (const el of arr.elements) {
    if (!ts.isObjectLiteralExpression(el)) continue
    const idProp = getProp(el, 'id')
    const inputsProp = getProp(el, 'inputs')
    if (!idProp || !inputsProp) continue
    const id = getNumberLiteral(idProp.initializer)
    if (id === null) continue
    const nextInputs = want.get(id)
    if (!nextInputs) continue
    const init = inputsProp.initializer
    edits.push({
      nodeId: id,
      start: init.getStart(sf, false),
      end: init.getEnd(),
      text: formatInputsInline(nextInputs)
    })
  }

  edits.sort((a, b) => b.start - a.start)
  for (const e of edits) {
    src = src.slice(0, e.start) + e.text + src.slice(e.end)
    changed++
  }

  fs.writeFileSync(pinRecordsPath, src, 'utf8')

  process.stdout.write(
    `[ok] patched inputs for ${changed}/${patches.length} mismatched node ids\n` +
      (errors.length ? `[warn] failed: ${JSON.stringify(errors.slice(0, 10))}\n` : '')
  )
}

main()


