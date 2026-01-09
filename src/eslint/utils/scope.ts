import type { Rule } from 'eslint'
import ts from 'typescript'

import { getSourceCode, requireParserServices } from './parser.js'
import { DEFAULT_GSTS_SERVER_PREFIX, isGstsServerName, isServerOnCall } from './ts_matchers.js'

type RuleContext = Rule.RuleContext

export type ServerScopeIndex = {
  serverScopeRoots: WeakSet<object>
  isServerScopeFunction(node: unknown): boolean
  isInServerScope(node: unknown, options: ServerScopeOptions): boolean
}

export type ServerScopeOptions = {
  scope: 'server' | 'all'
  includeNestedFunctions: boolean
}

function isFunctionNode(node: any): boolean {
  return (
    node &&
    (node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression')
  )
}

export function buildServerScopeIndex(
  context: RuleContext,
  prefixes = [DEFAULT_GSTS_SERVER_PREFIX]
): ServerScopeIndex {
  const services = requireParserServices(context)
  const sourceCode = getSourceCode(context)
  const tsRoot = services.esTreeNodeToTSNodeMap.get(sourceCode.ast) as ts.SourceFile
  const serverScopeRoots = new WeakSet<object>()

  const addRoot = (node: ts.Node | undefined) => {
    if (!node) return
    const esNode = services.tsNodeToESTreeNodeMap.get(node)
    if (esNode) serverScopeRoots.add(esNode)
  }

  for (const stmt of tsRoot.statements) {
    if (ts.isFunctionDeclaration(stmt) && isGstsServerName(stmt.name?.text, prefixes)) {
      addRoot(stmt)
      continue
    }
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue
        if (!isGstsServerName(decl.name.text, prefixes)) continue
        if (
          decl.initializer &&
          (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
        ) {
          addRoot(decl.initializer)
        }
      }
    }
  }

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && isServerOnCall(node, services.program.getTypeChecker())) {
      const handler = node.arguments[1]
      if (handler && (ts.isArrowFunction(handler) || ts.isFunctionExpression(handler))) {
        addRoot(handler)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(tsRoot)

  const isServerScopeFunction = (node: unknown) => serverScopeRoots.has(node as object)

  const isInServerScope = (node: unknown, options: ServerScopeOptions): boolean => {
    if (options.scope === 'all') return true
    let cur: any = node
    let firstFn: any | null = null
    while (cur) {
      if (isFunctionNode(cur)) {
        if (!firstFn) firstFn = cur
        if (serverScopeRoots.has(cur)) {
          return options.includeNestedFunctions ? true : cur === firstFn
        }
      }
      cur = cur.parent
    }
    return false
  }

  return { serverScopeRoots, isServerScopeFunction, isInServerScope }
}
