import type { Argument, IRDocument } from '../../runtime/IR.js'

const elementValueTypeFromListValueType = (t: string): string | undefined =>
  t.endsWith('_list') ? t.slice(0, -5) : undefined

// IR JSON 语法糖：列表字面量参数会自动展开为一个 `assembly_list` 数据节点并建立连接
export const expandListLiterals = (input: IRDocument) => {
  const nodes = [...input.nodes!]
  let nextId = Math.max(...nodes.map((n) => n.id)) + 1

  for (const node of nodes) {
    const nodeType = node.type
    const args = node.args ?? []
    for (let idx = 0; idx < args.length; idx++) {
      const arg = args[idx]
      if (!arg || arg.type === 'conn') continue
      if (!arg.type.endsWith('_list')) continue
      if (nodeType === 'assembly_list') continue

      const elemType = elementValueTypeFromListValueType(arg.type)!

      const items: unknown[] = Array.isArray(arg.value) ? (arg.value as unknown[]) : []
      const assemblyArgs: Argument[] = items.map(
        (v) =>
          ({
            type: elemType,
            value: v
          }) as Argument
      )

      const newId = nextId++

      nodes.push({
        id: newId,
        type: 'assembly_list',
        args: assemblyArgs
      })

      args[idx] = {
        type: 'conn',
        value: { node_id: newId, index: 0, type: arg.type }
      }
    }
    node.args = args
  }

  return { ir: { ...input, nodes } }
}
