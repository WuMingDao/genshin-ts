import path from 'node:path'
import { fileURLToPath } from 'node:url'

import protobuf from 'protobufjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const DEFAULT_GIA_PROTO = path.resolve(
  __dirname,
  '../thirdparty/Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/protobuf/gia.proto'
)

type GiaProto = {
  root: protobuf.Root
  rootMessage: protobuf.Type
  nodeGraphMessage: protobuf.Type
}

const protoCache = new Map<string, GiaProto>()

export function loadGiaProto(protoPath: string = DEFAULT_GIA_PROTO) {
  const abs = path.resolve(protoPath)
  const cached = protoCache.get(abs)
  if (cached) return cached
  const root = new protobuf.Root().loadSync(abs, { keepCase: true })
  const res: GiaProto = {
    root,
    rootMessage: root.lookupType('Root'),
    nodeGraphMessage: root.lookupType('NodeGraph')
  }
  protoCache.set(abs, res)
  return res
}
