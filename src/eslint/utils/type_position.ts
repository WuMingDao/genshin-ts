import ts from 'typescript'

export function isInTypePosition(node: ts.Node): boolean {
  let cur: ts.Node | undefined = node
  while (cur?.parent) {
    const parent: ts.Node = cur.parent
    if (ts.isTypeNode(parent)) return true
    if (ts.isTypeQueryNode(parent)) return true
    if (ts.isImportTypeNode(parent)) return true
    cur = parent
  }
  return false
}
