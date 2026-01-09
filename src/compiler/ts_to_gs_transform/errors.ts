import ts from 'typescript'

import type { Env } from './types.js'

function pathBasename(p: string) {
  const idx = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'))
  return idx >= 0 ? p.slice(idx + 1) : p
}

function getNodePos(file: ts.SourceFile, node: ts.Node) {
  const { line, character } = file.getLineAndCharacterOfPosition(node.getStart(file))
  return `${pathBasename(file.fileName)}:${line + 1}:${character + 1}`
}

export function fail(env: Env, node: ts.Node, message: string): never {
  const pos = getNodePos(env.file, node)
  const kind = ts.SyntaxKind[node.kind]
  throw new Error(`[error] ${message}\n  at ${pos} (${kind})`)
}

export function warn(env: Env, node: ts.Node, message: string) {
  const pos = getNodePos(env.file, node)
  const kind = ts.SyntaxKind[node.kind]
  console.warn(`[warn] ${message}\n  at ${pos} (${kind})`)
}

export function errorPos(file: ts.SourceFile, node: ts.Node) {
  return getNodePos(file, node)
}
