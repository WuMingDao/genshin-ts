import ts from 'typescript'

import type { Env } from './types.js'

export function isIdentifierText(expr: ts.Expression, text: string): boolean {
  return ts.isIdentifier(expr) && expr.text === text
}

export function makeFCall(env: Env, method: string, args: ts.Expression[]) {
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(env.gstsIdent), 'f'),
      method
    ),
    undefined,
    args
  )
}

export function withSameRange<T extends ts.Node>(newNode: T, oldNode: ts.Node): T {
  return ts.setTextRange(newNode, oldNode)
}

export function asBlock(stmt: ts.Statement): ts.Block {
  return ts.isBlock(stmt) ? stmt : ts.factory.createBlock([stmt], true)
}

export function isTrueLike(expr: ts.Expression): boolean {
  if (expr.kind === ts.SyntaxKind.TrueKeyword) return true
  return false
}
