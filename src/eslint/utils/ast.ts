export function isIdentifier(
  node: any,
  name?: string
): node is { type: 'Identifier'; name: string } {
  return !!node && node.type === 'Identifier' && (name ? node.name === name : true)
}

export function isStringLiteral(node: any): node is { type: 'Literal'; value: string } {
  return !!node && node.type === 'Literal' && typeof node.value === 'string'
}

export function isBooleanLiteral(
  node: any,
  value?: boolean
): node is { type: 'Literal'; value: boolean } {
  return (
    !!node &&
    node.type === 'Literal' &&
    typeof node.value === 'boolean' &&
    (value === undefined ? true : node.value === value)
  )
}

export function getMemberName(node: any): string | null {
  if (!node || node.type !== 'MemberExpression') return null
  if (!node.computed && node.property?.type === 'Identifier') return node.property.name
  if (node.computed && isStringLiteral(node.property)) return node.property.value
  return null
}

export function isFunctionNode(node: any): boolean {
  return (
    node &&
    (node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression')
  )
}
