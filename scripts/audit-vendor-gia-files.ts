import fs from 'node:fs'
import path from 'node:path'

import fg from 'fast-glob'

import {
  get_type,
  reflects_records,
  to_node_pin,
  type_equal,
  type NodePins,
  type NodeType
} from '../src/thirdparty/Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/gia_gen/nodes.js'
import { NODE_ID } from '../src/thirdparty/Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/node_data/node_id.js'
import {
  NODE_PIN_RECORDS,
  type NodePinsRecords
} from '../src/thirdparty/Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/node_data/node_pin_records.js'
import { decode_gia_file } from '../src/thirdparty/Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/protobuf/decode.js'
import {
  VarBase_Class,
  VarBase_ItemType_ServerType_Kind,
  VarType
} from '../src/thirdparty/Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/protobuf/gia.proto.js'

type Issue =
  | {
      kind: 'missing_record'
      file: string
      nodeIndex: number
      nodeId: number
      idSource: 'concrete' | 'generic'
    }
  | {
      kind: 'generic_only_node_skipped'
      file: string
      nodeIndex: number
      nodeId: number
    }
  | {
      kind: 'pin_index_out_of_range'
      file: string
      nodeIndex: number
      nodeId: number
      idSource: 'concrete' | 'generic'
      pinKind: number
      pinIndex: number
      expectedIn: number
      expectedOut: number
    }
  | {
      kind: 'pin_type_mismatch'
      file: string
      nodeIndex: number
      nodeId: number
      idSource: 'concrete' | 'generic'
      io: 'inputs' | 'outputs'
      pinIndex: number
      expected: string
      actual: string
    }
  | {
      kind: 'target_node_not_found'
      file: string
      expectedNodeType: string
      expectedNodeIds: number[]
    }

function stringifyType(t: NodeType | undefined): string {
  if (!t) return 'undefined'
  switch (t.t) {
    case 'b':
      return t.b
    case 'e':
      return `E<${t.e}>`
    case 'l':
      return `L<${stringifyType(t.i)}>`
    case 'd':
      return `D<${stringifyType(t.k)},${stringifyType(t.v)}>`
    case 's':
      return `S<${t.f.map(([n, tt]) => `${n}:${stringifyType(tt)}`).join(',')}>`
    case 'r':
      return `R<${t.r}>`
  }
}

function resolvePins(rec: NodePinsRecords, nodeId: number): NodePins {
  if (!rec.reflectMap) return to_node_pin(rec)
  // allow_undefined=true：有些 concreteId 并不在 reflectMap（vendor 数据不全），此时按 generic rec 解析
  return reflects_records(rec, nodeId, true)
}

function normalizeCnName(s: string): string {
  return s.replace(/[：:]/g, '').replace(/\s+/g, '').trim()
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
}

function buildCnNameToNodeTypeMapFromNodesTs(): Map<string, string> {
  // 通过 nodes.ts 的 JSDoc:
  // - node 的中文标题行形如：`* 三维向量内积: ...`
  // - 并且它出现在 `@param/@returns` 之前（参数行会在 @param 之后且也可能带 `:`，要避免污染）
  const nodesTs = path.resolve('src/definitions/nodes.ts')
  const text = fs.readFileSync(nodesTs, 'utf8')
  const lines = text.split(/\r?\n/g)

  const cnToNodeType = new Map<string, string>()
  let inDoc = false
  let docTitle: string | undefined
  let seenAtTag = false
  let lastDocTitle: string | undefined

  const titleRe = /^\s*\*\s*([^*@].*?)\s*:\s*(.+)$/
  const nodeTypeRe = /nodeType:\s*'([^']+)'/

  for (const line of lines) {
    if (line.includes('/**')) {
      inDoc = true
      docTitle = undefined
      seenAtTag = false
      continue
    }
    if (inDoc) {
      if (/^\s*\*\s*@/.test(line)) seenAtTag = true
      if (!seenAtTag && !docTitle) {
        const m = line.match(titleRe)
        if (m) {
          const title = m[1]?.trim() ?? ''
          if (/[\u4e00-\u9fff]/.test(title)) {
            docTitle = title
          }
        }
      }
      if (line.includes('*/')) {
        inDoc = false
        lastDocTitle = docTitle
      }
      continue
    }

    const nm = line.match(nodeTypeRe)
    if (nm && lastDocTitle) {
      const key = normalizeCnName(lastDocTitle)
      if (key && !cnToNodeType.has(key)) cnToNodeType.set(key, nm[1]!)
      lastDocTitle = undefined
    }
  }
  return cnToNodeType
}

function buildCnNameToNodeTypeMapFromEventsPayloadTs(): Map<string, string> {
  // 通过 events-payload.ts 的 JSDoc:
  // - event 的中文标题行形如：`* 被恢复生命值时: ...`
  // - 并且紧跟着的 key 形如 `whenHpIsRecovered: { ... }`
  // - 将 key 转 snake_case 后，可与 node_id.ts 的 key（小写）稳定对应（when_hp_is_recovered）
  const evTs = path.resolve('src/definitions/events-payload.ts')
  const text = fs.readFileSync(evTs, 'utf8')
  const lines = text.split(/\r?\n/g)

  const cnToNodeType = new Map<string, string>()
  let inDoc = false
  let docTitle: string | undefined
  let seenAtTag = false
  let lastDocTitle: string | undefined
  let inPayloads = false

  const titleRe = /^\s*\*\s*([^*@].*?)\s*:\s*(.+)$/
  const keyRe = /^\s*([A-Za-z0-9_]+)\s*:\s*\{/

  for (const line of lines) {
    if (line.includes('export type ServerEventPayloads')) {
      inPayloads = true
      continue
    }

    if (line.includes('/**')) {
      inDoc = true
      docTitle = undefined
      seenAtTag = false
      continue
    }
    if (inDoc) {
      if (/^\s*\*\s*@/.test(line)) seenAtTag = true
      if (!seenAtTag && !docTitle) {
        const m = line.match(titleRe)
        if (m) {
          const title = m[1]?.trim() ?? ''
          if (/[\u4e00-\u9fff]/.test(title)) docTitle = title
        }
      }
      if (line.includes('*/')) {
        inDoc = false
        lastDocTitle = docTitle
      }
      continue
    }

    if (!inPayloads) continue
    const km = line.match(keyRe)
    if (km && lastDocTitle) {
      const key = normalizeCnName(lastDocTitle)
      const nodeType = camelToSnake(km[1]!)
      if (key && !cnToNodeType.has(key)) cnToNodeType.set(key, nodeType)
      lastDocTitle = undefined
    }
  }

  return cnToNodeType
}

function buildCnNameToNodeTypeMap(): Map<string, string> {
  const cnToNodeType = new Map<string, string>()
  for (const [k, v] of buildCnNameToNodeTypeMapFromNodesTs()) cnToNodeType.set(k, v)
  for (const [k, v] of buildCnNameToNodeTypeMapFromEventsPayloadTs()) {
    if (!cnToNodeType.has(k)) cnToNodeType.set(k, v)
  }
  return cnToNodeType
}

function guessNodeTypeFromFilename(
  baseName: string,
  cnToNodeType: Map<string, string>
): string | undefined {
  const k = normalizeCnName(baseName)
  if (!k) return undefined
  const exact = cnToNodeType.get(k)
  if (exact) return exact

  // 允许“文件名包含中文节点名”或反过来（例如带附加信息/标点的文件名）
  let bestKey: string | undefined
  for (const kk of cnToNodeType.keys()) {
    if (k.includes(kk) || kk.includes(k)) {
      if (!bestKey || kk.length > bestKey.length) bestKey = kk
    }
  }
  return bestKey ? cnToNodeType.get(bestKey) : undefined
}

function expandExpectedNodeIds(nodeType: string): Set<number> {
  const want = nodeType.toLowerCase()
  const ids = new Set<number>()
  for (const [k, v] of Object.entries(NODE_ID as Record<string, number>)) {
    const kl = k.toLowerCase()
    if (kl === want || kl.startsWith(`${want}__`)) ids.add(v)
  }
  return ids
}

function safePinNodeType(pin: any): NodeType | undefined {
  if (!pin) return undefined
  const base = get_type(pin.type)
  if (!base) return undefined

  // 尽量补全 dict 的 k/v 类型（很多“连线图”没有 value，仅有 connects/type）
  if (base.t === 'd') {
    // 重要：连线图里 dict pin 常见 value=null，此时 protobuf 只给了 VarType.Dictionary，
    // 不包含 k/v itemType。get_type(VarType.Dictionary) 会回退成 D<Ety,Ety> 占位，不能用于校验。
    // 标记为“incomplete dict”，在比较时只校验它是 dict，不校验 k/v。
    if (pin.value == null) {
      ;(base as any).__incompleteDict = true
      return base
    }
    try {
      const v = pin.value?.bConcreteValue?.value
      if (!v || v.class !== VarBase_Class.MapBase) return base
      const t = v.itemType?.type_server
      if (!t || t.type !== VarType.Dictionary || t.kind !== VarBase_ItemType_ServerType_Kind.Pair)
        return base
      const key = t.items?.key
      const value = t.items?.value
      if (typeof key === 'number') base.k = get_type(key)
      if (typeof value === 'number') base.v = get_type(value)
      return base
    } catch {
      return base
    }
  }
  return base
}

function isGenericEnum(t: NodeType | undefined): boolean {
  return !!t && t.t === 'e' && t.e === 0
}

function main() {
  const rootDir = process.argv[2] ?? 'D:/_S2/mypy_test/server_nodes'
  const outJson = process.argv[3] ?? 'tests/generated/_vendor_gia_pin_audit.json'

  const patterns = ['**/*_填值.gia', '**/*_连线.gia']

  const files = fg.sync(patterns, {
    cwd: rootDir,
    absolute: true,
    onlyFiles: true,
    unique: true
  })

  const byId = new Map<number, NodePinsRecords>()
  for (const r of NODE_PIN_RECORDS as unknown as NodePinsRecords[]) {
    byId.set(r.id, r)
  }
  // 重要：很多 records 通过 reflectMap 覆盖多个 concreteId（一个节点多 id）
  // 例如 id=1298 的记录会在 reflectMap 内包含 1299/1300/... 等。
  // vendor .gia 里出现这些 concreteId 时，应当视为“存在记录”，并用同一条 records 做解析。
  for (const r of NODE_PIN_RECORDS as unknown as NodePinsRecords[]) {
    const rm = (r as any).reflectMap
    if (!Array.isArray(rm)) continue
    for (const pair of rm) {
      const id = pair?.[0]
      if (typeof id === 'number' && !byId.has(id)) byId.set(id, r)
    }
  }

  const cnToNodeType = buildCnNameToNodeTypeMap()

  const issues: Issue[] = []
  let totalFiles = 0
  let totalNodesAll = 0
  let totalNodesConsidered = 0
  let totalNodesConcreteConsidered = 0
  let totalNodesGenericOnlyConsidered = 0
  let totalNodesSkippedByFilename = 0
  let filesWithExpectedNodeType = 0

  for (const abs of files) {
    totalFiles++
    let root
    try {
      root = decode_gia_file(abs)
    } catch (e) {
      // decode 失败直接记录为 missing_record（更准确的分类没必要）
      continue
    }

    const baseName = path
      .basename(abs)
      .replace(/_(填值|连线)\.gia$/u, '')
      .replace(/\.gia$/u, '')
    // 结构体相关节点在 vendor 中使用另一套超大 nodeId（例如 161061273x），目前 records 不覆盖。
    // 用户明确要求：文件名涉及“结构体”的直接忽略，不纳入审计。
    if (baseName.includes('结构体')) continue
    const expectedNodeType = guessNodeTypeFromFilename(baseName, cnToNodeType)
    const expectedIds = expectedNodeType
      ? expandExpectedNodeIds(expectedNodeType)
      : new Set<number>()
    if (expectedNodeType) filesWithExpectedNodeType++

    const nodes = root?.graph?.graph?.inner?.graph?.nodes ?? []
    let foundTargetInFile = expectedIds.size === 0
    for (const n of nodes) {
      totalNodesAll++
      const nodeIndex = n.nodeIndex ?? -1
      const concrete = n.concreteId?.nodeId
      const generic = n.genericId?.nodeId
      const idSource: 'concrete' | 'generic' = typeof concrete === 'number' ? 'concrete' : 'generic'
      const nodeId = (typeof concrete === 'number' ? concrete : generic) as number | undefined
      if (typeof nodeId !== 'number') continue

      // 只校验“文件名对应的节点”，其余节点（误操作产生）忽略
      if (expectedIds.size > 0 && !expectedIds.has(nodeId)) {
        totalNodesSkippedByFilename++
        continue
      }
      foundTargetInFile = true
      totalNodesConsidered++

      if (idSource === 'concrete') totalNodesConcreteConsidered++
      else totalNodesGenericOnlyConsidered++

      const rec = byId.get(nodeId)
      if (!rec) {
        issues.push({ kind: 'missing_record', file: abs, nodeIndex, nodeId, idSource })
        continue
      }

      // 只有 genericId 的节点，通常是“空 frame/模板节点”或未实例化的泛型节点：
      // pins 的类型/数量不具备稳定可比性，跳过类型校验，避免海量噪声。
      if (idSource === 'generic') {
        // 用户要求：generic_only_node_skipped 全部忽略（不写入 issues）
        continue
      }

      const expected = resolvePins(rec, nodeId)
      const expectedIn = expected.inputs.length
      const expectedOut = expected.outputs.length

      // build actual pin type map using thirdparty extractor (handles dict k/v)
      const actualIn = new Map<number, NodeType>()
      const actualOut = new Map<number, NodeType>()
      for (const pin of n.pins ?? []) {
        const kind = pin?.i1?.kind
        const idx = pin?.i1?.index ?? 0
        const nt = safePinNodeType(pin)
        if (!nt) continue
        if (kind === 3) actualIn.set(idx, nt)
        else if (kind === 4) actualOut.set(idx, nt)
      }

      // sanity: report pins that exceed record ranges
      for (const [idx] of actualIn) {
        if (idx >= expectedIn) {
          issues.push({
            kind: 'pin_index_out_of_range',
            file: abs,
            nodeIndex,
            nodeId,
            idSource,
            pinKind: 3,
            pinIndex: idx,
            expectedIn,
            expectedOut
          })
        }
      }
      for (const [idx] of actualOut) {
        if (idx >= expectedOut) {
          issues.push({
            kind: 'pin_index_out_of_range',
            file: abs,
            nodeIndex,
            nodeId,
            idSource,
            pinKind: 4,
            pinIndex: idx,
            expectedIn,
            expectedOut
          })
        }
      }

      // compare types only where GIA actually wrote a pin
      for (const [idx, actualT] of actualIn) {
        const expectedT = expected.inputs[idx]
        if (!expectedT) continue
        // vendor 里大量枚举会被写成 E<0>（Generic enum bucket），无法可靠校验，直接忽略
        if (isGenericEnum(actualT)) continue
        // vendor 里 dict pin 在“连线图”常无 itemType（value=null），此时只校验 dict 本身即可
        if ((actualT as any).__incompleteDict && expectedT.t === 'd' && actualT.t === 'd') continue
        if (!type_equal(expectedT, actualT)) {
          issues.push({
            kind: 'pin_type_mismatch',
            file: abs,
            nodeIndex,
            nodeId,
            idSource,
            io: 'inputs',
            pinIndex: idx,
            expected: stringifyType(expectedT),
            actual: stringifyType(actualT)
          })
        }
      }
      for (const [idx, actualT] of actualOut) {
        const expectedT = expected.outputs[idx]
        if (!expectedT) continue
        // vendor 里大量枚举会被写成 E<0>（Generic enum bucket），无法可靠校验，直接忽略
        if (isGenericEnum(actualT)) continue
        // vendor 里 dict pin 在“连线图”常无 itemType（value=null），此时只校验 dict 本身即可
        if ((actualT as any).__incompleteDict && expectedT.t === 'd' && actualT.t === 'd') continue
        if (!type_equal(expectedT, actualT)) {
          issues.push({
            kind: 'pin_type_mismatch',
            file: abs,
            nodeIndex,
            nodeId,
            idSource,
            io: 'outputs',
            pinIndex: idx,
            expected: stringifyType(expectedT),
            actual: stringifyType(actualT)
          })
        }
      }
    }

    if (!foundTargetInFile && expectedNodeType && expectedIds.size > 0) {
      issues.push({
        kind: 'target_node_not_found',
        file: abs,
        expectedNodeType,
        expectedNodeIds: [...expectedIds].sort((a, b) => a - b)
      })
    }
  }

  const report = {
    rootDir,
    scannedFiles: totalFiles,
    filesWithExpectedNodeType,
    scannedNodesAll: totalNodesAll,
    scannedNodesConsidered: totalNodesConsidered,
    scannedNodesSkippedByFilename: totalNodesSkippedByFilename,
    scannedNodesConcreteConsidered: totalNodesConcreteConsidered,
    scannedNodesGenericOnlyConsidered: totalNodesGenericOnlyConsidered,
    issueCount: issues.length,
    issues
  }

  fs.mkdirSync(path.dirname(outJson), { recursive: true })
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf8')

  const byKind = new Map<string, number>()
  for (const i of issues) byKind.set(i.kind, (byKind.get(i.kind) ?? 0) + 1)
  console.log(
    '[ok] scanned files:',
    totalFiles,
    'nodes(all):',
    totalNodesAll,
    'nodes(considered):',
    totalNodesConsidered
  )
  console.log('[ok] report:', outJson)
  console.log('[ok] issues:', issues.length, Object.fromEntries(byKind.entries()))
}

main()
