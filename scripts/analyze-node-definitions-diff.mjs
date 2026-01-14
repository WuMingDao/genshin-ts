import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const args = new Set(process.argv.slice(2))
const full = args.has('--full') || args.size === 0
const ignoreGsts = !args.has('--include-gsts')

const rawDefPath = path.join(ROOT, 'resources', 'node_definitions.json')
const nodesPath = path.join(ROOT, 'src', 'definitions', 'nodes.ts')
const outPath = path.join(
  ROOT,
  'resources',
  full ? 'node_definitions_diff_full.json' : 'node_definitions_diff.json'
)

const rawDef = JSON.parse(fs.readFileSync(rawDefPath, 'utf8'))
const nodesText = fs.readFileSync(nodesPath, 'utf8')

const TYPE_MAP = {
  boolean: 'bool',
  'boolean value': 'bool',
  bool: 'bool',
  integer: 'int',
  int: 'int',
  'integer list': 'int_list',
  float: 'float',
  'floating point numbers': 'float',
  'floating-point numbers': 'float',
  'floating point number list': 'float_list',
  string: 'str',
  text: 'str',
  'string list': 'str_list',
  guid: 'guid',
  'prefab id': 'prefabId',
  'config id': 'configId',
  'config id list': 'configId_list',
  faction: 'faction',
  'faction list': 'faction_list',
  entity: 'entity',
  'entity list': 'entity_list',
  enumeration: 'enumeration',
  dictionary: 'dict',
  'generic dictionary': 'dict',
  'custom variable snapshot': 'customVariableSnapshot',
  generic: 'generic',
  'generic list': 'generic_list',
  '3d vector': 'vec3',
  vector: 'vec3',
  'local variable': 'localVariable'
}

function toIdentifier(name) {
  const parts = name
    .split(/[^a-zA-Z0-9]+/g)
    .map((part) => part.toLowerCase())
    .filter((part) => /^[a-z0-9]+$/.test(part))
  const [head, ...rest] = parts
  let id = head[0].toLowerCase() + head.slice(1) + rest.map((p) => p[0].toUpperCase() + p.slice(1)).join('')
  if (/^[0-9]/.test(id)) id = `_${id}`
  return id
}

function mapType(type) {
  const t = type.trim().toLowerCase()
  return TYPE_MAP[t] ?? 'unknown'
}

function normalizeTypeText(typeText, enumNames, mode) {
  if (!typeText) return mode === 'return' ? 'void' : 'unknown'
  let t = typeText.replace(/\s+/g, '')
  if (!t) return mode === 'return' ? 'void' : 'unknown'
  if (t === 'void') return 'void'

  const listSuffix = t.endsWith('[]')
  if (listSuffix) {
    const inner = normalizeTypeText(t.slice(0, -2), enumNames, mode)
    return inner === 'unknown' ? 'unknown_list' : `${inner}_list`
  }

  if (t.startsWith('RuntimeParameterValueTypeMap') || t.startsWith('RuntimeReturnValueTypeMap')) {
    if (t.includes('_list') || t.includes('list')) return 'generic_list'
    return 'generic'
  }

  if (t.startsWith('dict<') || t === 'DictValue' || t === 'DictValueType' || t === 'DictValueTypeMap') {
    return 'dict'
  }

  if (enumNames.has(t)) return 'enumeration'

  if (/EntityOf<|Entity$/.test(t) || /Entity\b/.test(t)) return 'entity'

  const valueMap = {
    BoolValue: 'bool',
    IntValue: 'int',
    FloatValue: 'float',
    StrValue: 'str',
    Vec3Value: 'vec3',
    GuidValue: 'guid',
    PrefabIdValue: 'prefabId',
    ConfigIdValue: 'configId',
    FactionValue: 'faction',
    EntityValue: 'entity',
    CustomVariableSnapshotValue: 'customVariableSnapshot',
    LocalVariableValue: 'localVariable',
    EnumerationValue: 'enumeration',
    GenericValue: 'generic'
  }
  if (valueMap[t]) return valueMap[t]

  if (t === 'boolean') return 'bool'
  if (t === 'bigint') return 'int'
  if (t === 'number') return 'float'
  if (t === 'string') return 'str'
  if (t === 'vec3') return 'vec3'
  if (t === 'guid') return 'guid'
  if (t === 'entity') return 'entity'
  if (t === 'prefabId') return 'prefabId'
  if (t === 'configId') return 'configId'
  if (t === 'customVariableSnapshot') return 'customVariableSnapshot'
  if (t === 'localVariable') return 'localVariable'
  if (t === 'faction') return 'faction'
  if (t.startsWith('list<')) {
    const inner = t.slice(5, -1).replace(/['"]/g, '')
    const base = normalizeTypeText(inner, enumNames, mode)
    return base === 'unknown' ? 'unknown_list' : `${base}_list`
  }
  return 'unknown'
}

function buildNodesFromJson() {
  const nodeKeys = ['server_exec_en-us', 'server_flow_en-us', 'server_calc_en-us', 'server_query_en-us']
  const nodes = new Map()

  for (const key of nodeKeys) {
    const nodeDef = rawDef[key]
    const nodeDefZh = rawDef[key.replace('en-us', 'zh-cn')]
    nodeDef.sections.forEach((section, sIndex) => {
      section.nodes.forEach((node, nIndex) => {
        const nodeName = toIdentifier(node.name)
        const nodeZh = nodeDefZh?.sections?.[sIndex]?.nodes?.[nIndex]

        let inputParamCounter = 0
        const params = !('parameters' in node)
          ? []
          : (node.parameters || [])
              .map((p) => {
                const isInput = p.io.toLowerCase().includes('input')
                let paramName = p.name
                if (!paramName && isInput) {
                  inputParamCounter++
                  paramName = `input${inputParamCounter}`
                }
                if (!paramName) return null
                const rawName = toIdentifier(paramName)
                const adjustedName = nodeName === 'equal' && /^enumeration\d+$/.test(rawName) ? rawName.replace('enumeration', 'input') : rawName
                return {
                  name: adjustedName,
                  type: mapType(p.data_type),
                  input: isInput
                }
              })
              .filter(Boolean)

        const inputs = params.filter((p) => p.input)
        const outputs = params.filter((p) => !p.input)

        nodes.set(nodeName, {
          name: nodeName,
          inputs,
          outputs
        })
      })
    })
  }
  return nodes
}

function parseNodesTs() {
  const source = ts.createSourceFile(nodesPath, nodesText, ts.ScriptTarget.Latest, true)
  const startMarker = nodesText.indexOf('// === AUTO-GENERATED START ===')
  const endMarker = nodesText.indexOf('// === AUTO-GENERATED END ===')

  const enumNames = new Set()
  for (const stmt of source.statements) {
    if (!ts.isImportDeclaration(stmt)) continue
    const moduleName = stmt.moduleSpecifier.text
    if (moduleName !== './enum.js') continue
    const bindings = stmt.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) continue
    for (const el of bindings.elements) enumNames.add(el.name.text)
  }

  const gstsMethods = new Set()
  for (const stmt of source.statements) {
    if (!ts.isClassDeclaration(stmt)) continue
    if (stmt.name?.text !== 'ServerExecutionFlowFunctions') continue
    for (const member of stmt.members) {
      if (!ts.isMethodDeclaration(member)) continue
      const name = member.name && ts.isIdentifier(member.name) ? member.name.text : null
      if (!name) continue
      const tags = ts.getJSDocTags(member)
      if (tags.some((tag) => tag.tagName.getText(source) === 'gsts')) {
        gstsMethods.add(name)
      }
    }
  }

  const nodes = new Map()
  for (const stmt of source.statements) {
    if (!ts.isClassDeclaration(stmt)) continue
    if (stmt.name?.text !== 'ServerExecutionFlowFunctions') continue
    for (const member of stmt.members) {
      if (!ts.isMethodDeclaration(member)) continue
      if (!member.body) continue
      const modifiers = ts.getCombinedModifierFlags(member)
      if (modifiers & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) continue
      const start = member.getStart(source)
      const end = member.getEnd()
      if (!full && (start < startMarker || end > endMarker)) continue

      const name = member.name && ts.isIdentifier(member.name) ? member.name.text : null
      if (!name) continue

      if (ignoreGsts && gstsMethods.has(name)) continue

      const params = member.parameters.map((p) => {
        const paramName = p.name.getText(source)
        const typeText = p.type?.getText(source) ?? ''
        const typeBase = normalizeTypeText(typeText, enumNames, 'param')
        return { name: paramName, type: typeBase }
      })

      const outputs = []
      if (member.type && ts.isTypeLiteralNode(member.type)) {
        for (const m of member.type.members) {
          if (!ts.isPropertySignature(m) || !m.name) continue
          const propName = m.name.getText(source)
          const propTypeText = m.type?.getText(source) ?? ''
          const propTypeBase = normalizeTypeText(propTypeText, enumNames, 'return')
          outputs.push({ name: propName, type: propTypeBase })
        }
      } else {
        const returnTypeText = member.type?.getText(source) ?? 'void'
        const base = normalizeTypeText(returnTypeText, enumNames, 'return')
        if (base !== 'void') outputs.push({ name: null, type: base })
      }

      nodes.set(name, { name, inputs: params, outputs })
    }
  }

  return nodes
}

function signature(node) {
  const inSig = node.inputs.map((p) => p.type).join(',')
  const outSig = node.outputs.map((p) => p.type).join(',')
  return `in(${inSig})|out(${outSig})`
}

const expected = buildNodesFromJson()
const current = parseNodesTs()

const added = []
const removed = []
for (const [name] of expected) if (!current.has(name)) added.push(name)
for (const [name] of current) if (!expected.has(name)) removed.push(name)

const addedBySig = new Map()
for (const name of added) {
  const node = expected.get(name)
  const sig = signature(node)
  if (!addedBySig.has(sig)) addedBySig.set(sig, [])
  addedBySig.get(sig).push(name)
}

const renamePairs = []
const renamedAdded = new Set()
const renamedRemoved = new Set()

for (const name of removed) {
  const node = current.get(name)
  const sig = signature(node)
  const candidates = addedBySig.get(sig) || []
  if (candidates.length === 1) {
    const newName = candidates[0]
    renamePairs.push({ from: name, to: newName, signature: sig })
    renamedAdded.add(newName)
    renamedRemoved.add(name)
  }
}

const manualRenames = [
  ['modifyEntityFaction', 'setEntityFaction'],
  ['modifySkillCdPercentageBasedOnMaxCd', 'setSkillCdBasedOnMaximumCdPercentage'],
  ['modifyCharacterSkillCd', 'increaseCharacterSkillCd'],
  ['modifyInventoryItemQuantity', 'increaseInventoryItemQuantity'],
  ['modifyInventoryCurrencyQuantity', 'increaseInventoryCurrencyQuantity'],
  ['modifyLootItemComponentQuantity', 'increaseLootComponentItemQuantity'],
  ['modifyLootComponentCurrencyAmount', 'increaseLootComponentCurrencyQuantity'],
  ['modifyPlayerListForVisibleMiniMapMarkers', 'setPlayerListForVisibleMiniMapMarkers'],
  ['modifyPlayerListForTrackingMiniMapMarkers', 'setPlayerListForTrackingMiniMapMarkers']
]

for (const [from, to] of manualRenames) {
  if (renamedRemoved.has(from) || renamedAdded.has(to)) continue
  if (!removed.includes(from) || !added.includes(to)) continue
  const node = current.get(from) || expected.get(to)
  const sig = node ? signature(node) : ''
  renamePairs.push({ from, to, signature: sig, manual: true })
  renamedAdded.add(to)
  renamedRemoved.add(from)
}

const filteredAdded = added.filter((n) => !renamedAdded.has(n))
const filteredRemoved = removed.filter((n) => !renamedRemoved.has(n))

const result = {
  counts: {
    expected: expected.size,
    current: current.size,
    added: added.length,
    removed: removed.length,
    renamePairs: renamePairs.length
  },
  renamePairs,
  filteredAdded,
  filteredRemoved,
  added,
  removed
}

fs.writeFileSync(outPath, JSON.stringify(result, null, 2))
console.log(`Wrote ${outPath}`)
console.log(JSON.stringify({ counts: result.counts }, null, 2))
