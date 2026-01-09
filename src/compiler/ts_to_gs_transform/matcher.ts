import ts from 'typescript'

import { isIdentifierText } from './utils.js'

function unwrapExpression(expr: ts.Expression): ts.Expression {
  let current = expr
  while (true) {
    if (ts.isParenthesizedExpression(current)) {
      current = current.expression
      continue
    }
    if (ts.isAsExpression(current)) {
      current = current.expression
      continue
    }
    if (ts.isTypeAssertionExpression(current)) {
      current = current.expression
      continue
    }
    if (ts.isNonNullExpression(current)) {
      current = current.expression
      continue
    }
    if (ts.isSatisfiesExpression(current)) {
      current = current.expression
      continue
    }
    return current
  }
}

function isGServerCall(expr: ts.Expression): boolean {
  const target = unwrapExpression(expr)
  if (!ts.isCallExpression(target)) return false
  const callee = target.expression
  if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== 'server') return false
  return isIdentifierText(callee.expression, 'g')
}

function isServerInstanceExpression(
  expr: ts.Expression,
  checker: ts.TypeChecker,
  seen: Set<ts.Symbol>
): boolean {
  const target = unwrapExpression(expr)
  if (ts.isCallExpression(target)) {
    const callee = target.expression
    if (
      ts.isPropertyAccessExpression(callee) &&
      (callee.name.text === 'on' || callee.name.text === 'onSignal')
    ) {
      return isServerInstanceExpression(callee.expression, checker, seen)
    }
  }
  if (isGServerCall(target)) return true
  if (!ts.isIdentifier(target)) return false

  const symbol = checker.getSymbolAtLocation(target)
  if (!symbol || seen.has(symbol)) return false
  seen.add(symbol)

  const declarations = symbol.getDeclarations() ?? []
  for (const decl of declarations) {
    if (ts.isVariableDeclaration(decl) && decl.initializer) {
      if (isServerInstanceExpression(decl.initializer, checker, seen)) return true
    }
  }
  return false
}

export function isServerOnCall(call: ts.CallExpression, checker: ts.TypeChecker): boolean {
  const callee = call.expression
  if (!ts.isPropertyAccessExpression(callee)) return false
  if (callee.name.text !== 'on' && callee.name.text !== 'onSignal') return false
  return isServerInstanceExpression(callee.expression, checker, new Set())
}
