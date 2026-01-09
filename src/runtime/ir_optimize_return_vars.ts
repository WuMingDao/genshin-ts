import { IRNode } from '../compiler/ir_to_gia_transform/types.js'
import type { IRDocument, NextConnection } from './IR.js'

function normalizeNext(next: NextConnection[] | NextConnection | undefined): NextConnection[] {
  if (!next) return []
  return Array.isArray(next) ? next : [next]
}

function getNextTargetId(n: NextConnection): number {
  return typeof n === 'number' ? n : n.node_id
}

// 弃用的优化, 已改用局部变量实现return, 保留仅供未来类似代码参考
export function optimizeReturnVars(doc: IRDocument): IRDocument {
  if (!doc.nodes?.length) return doc

  // 收集所有被读取的 _gsts_return_<id>
  const readReturnVars = new Set<string>()
  doc.nodes.forEach((n) => {
    if (n.type !== 'get_node_graph_variable') return
    const nameArg = n.args?.[0]
    if (nameArg && nameArg.type === 'str' && typeof nameArg.value === 'string') {
      if (nameArg.value.startsWith('_gsts_return_')) {
        readReturnVars.add(nameArg.value)
      }
    }
  })

  const declaredReturnVars = new Set(
    (doc.variables ?? []).map((v) => v.name).filter((name) => name.startsWith('_gsts_return_'))
  )

  // 未被读取的 return 变量：可删
  const unusedReturnVars = [...declaredReturnVars].filter((name) => !readReturnVars.has(name))
  if (unusedReturnVars.length === 0) return doc
  const unusedSet = new Set(unusedReturnVars)

  // 需要删除的节点：set_node_graph_variable(_gsts_return_*)
  const removeNodeIds = new Set<number>()
  doc.nodes.forEach((n) => {
    if (n.type !== 'set_node_graph_variable') return
    const nameArg = n.args?.[0]
    if (nameArg && nameArg.type === 'str' && typeof nameArg.value === 'string') {
      if (unusedSet.has(nameArg.value)) {
        removeNodeIds.add(n.id)
      }
    }
  })
  if (removeNodeIds.size === 0) {
    return {
      ...doc,
      variables: (doc.variables ?? []).filter((v) => !unusedSet.has(v.name))
    }
  }

  const nodesById = new Map<number, IRNode>()
  doc.nodes.forEach((n) => nodesById.set(n.id, n))

  // 先对所有其他节点的 next 做“桥接”
  const patchedNodes = doc.nodes.map((n) => {
    if (!n.next) return n
    const nextList = normalizeNext(n.next)
    let changed = false
    const out: NextConnection[] = []

    nextList.forEach((conn) => {
      const targetId = getNextTargetId(conn)
      if (!removeNodeIds.has(targetId)) {
        out.push(conn)
        return
      }
      changed = true
      const removedNode = nodesById.get(targetId)
      const removedNext = normalizeNext(removedNode?.next)
      if (removedNext.length === 0) {
        // 被移除节点没有 next，相当于剪断该连线
        return
      }
      removedNext.forEach((removedConn) => {
        const newTarget = getNextTargetId(removedConn)
        if (typeof conn === 'number') {
          out.push(newTarget)
        } else {
          out.push({ ...conn, node_id: newTarget })
        }
      })
    })

    if (!changed) return n
    return {
      ...n,
      next: out.length === 0 ? undefined : out
    }
  })

  const filteredNodes = patchedNodes.filter((n) => !removeNodeIds.has(n.id))
  const filteredVars = (doc.variables ?? []).filter((v) => !unusedSet.has(v.name))

  return {
    ...doc,
    variables: filteredVars,
    nodes: filteredNodes
  }
}
