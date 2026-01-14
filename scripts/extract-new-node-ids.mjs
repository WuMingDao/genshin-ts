import fs from 'node:fs'
import path from 'node:path'
import protobuf from 'protobufjs'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

const classicPath =
  process.argv[2] ??
  '/mnt/c/Users/josSt/AppData/LocalLow/miHoYo/原神/BeyondLocal/Beyond_Local_Export/nodes_classic_all_work.gia'
const beyondPath =
  process.argv[3] ??
  '/mnt/c/Users/josSt/AppData/LocalLow/miHoYo/原神/BeyondLocal/Beyond_Local_Export/nodes_overdrive_all_work.gia'

const protoPath = path.join(
  ROOT,
  'src',
  'thirdparty',
  'Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack',
  'protobuf',
  'gia.proto'
)
const nodeIdPath = path.join(
  ROOT,
  'src',
  'thirdparty',
  'Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack',
  'node_data',
  'node_id.ts'
)

function loadNodeIdObject(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  const match = text.match(/export const NODE_ID\s*=\s*(\{[\s\S]*?\})/u)
  if (!match) throw new Error(`Failed to parse NODE_ID from ${filePath}`)
  return new Function(`return ${match[1]}`)()
}

function decodeGiaIds(giaPath) {
  const bytes = new Uint8Array(fs.readFileSync(giaPath))
  const protoBytes = bytes.slice(20, -4)
  const root = new protobuf.Root().loadSync(protoPath, { keepCase: true })
  const msg = root.lookupType('Root')
  const obj = msg.toObject(msg.decode(protoBytes), { defaults: true, longs: Number })
  const nodes = obj.graph?.graph?.inner?.graph?.nodes ?? []
  return nodes
    .map((n) => n.concreteId?.nodeId)
    .filter((id) => typeof id === 'number')
}

function writeIds(outPath, ids) {
  const content = ids.join('\n') + '\n'
  fs.writeFileSync(outPath, content)
}

const nodeIdObj = loadNodeIdObject(nodeIdPath)
const knownIds = new Set(Object.values(nodeIdObj))

const classicIds = new Set(decodeGiaIds(classicPath))
const beyondIds = new Set(decodeGiaIds(beyondPath))
const allIds = new Set([...classicIds, ...beyondIds])

const newIds = [...allIds].filter((id) => !knownIds.has(id)).sort((a, b) => a - b)

const outClassic = path.join(ROOT, 'docs', 'filtered_ids_classic.txt')
const outBeyond = path.join(ROOT, 'docs', 'filtered_ids_beyond.txt')
const outNew = path.join(ROOT, 'docs', 'new_node_ids.txt')

writeIds(outClassic, [...classicIds].sort((a, b) => a - b))
writeIds(outBeyond, [...beyondIds].sort((a, b) => a - b))
writeIds(outNew, newIds)

console.log(`[ok] classic ids: ${classicIds.size}`)
console.log(`[ok] beyond ids: ${beyondIds.size}`)
console.log(`[ok] new ids: ${newIds.length}`)
console.log(`[ok] wrote ${outClassic}`)
console.log(`[ok] wrote ${outBeyond}`)
console.log(`[ok] wrote ${outNew}`)
