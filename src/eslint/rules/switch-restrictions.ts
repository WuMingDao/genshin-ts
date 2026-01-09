import type { Rule } from 'eslint'
import ts from 'typescript'

import { formatMessage } from '../utils/messages.js'
import { readBaseOptions } from '../utils/options.js'
import { getParserServices } from '../utils/parser.js'
import { buildServerScopeIndex } from '../utils/scope.js'
import { getNumericKind, isStringType } from '../utils/types.js'

type Options = {
  allowFallthrough?: boolean
  lang?: 'zh' | 'en' | 'both'
  scope?: 'server' | 'all'
  includeNestedFunctions?: boolean
}

const DEFAULTS: Required<Options> = {
  allowFallthrough: false,
  lang: 'both',
  scope: 'server',
  includeNestedFunctions: true
}

function isStringLiteral(node: any): boolean {
  return node?.type === 'Literal' && typeof node.value === 'string'
}

function isIntLiteral(node: any): boolean {
  if (!node || node.type !== 'Literal') return false
  if (typeof node.value === 'number' && Number.isInteger(node.value)) return true
  if (typeof node.value === 'bigint') return true
  if (typeof node.bigint === 'string') return true
  return false
}

function lastNonEmptyStatement(stmts: any[]): any | null {
  for (let i = stmts.length - 1; i >= 0; i -= 1) {
    const stmt = stmts[i]
    if (!stmt || stmt.type === 'EmptyStatement') continue
    return stmt
  }
  return null
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        properties: {
          allowFallthrough: { type: 'boolean' },
          lang: { enum: ['zh', 'en', 'both'] },
          scope: { enum: ['server', 'all'] },
          includeNestedFunctions: { type: 'boolean' }
        },
        additionalProperties: false
      }
    ]
  },
  create(context) {
    const raw = (context.options[0] ?? {}) as Options
    const options = readBaseOptions(raw, DEFAULTS)
    const services = getParserServices(context)
    if (!services) return {}
    const checker = services.program.getTypeChecker()
    const scopeIndex = buildServerScopeIndex(context)

    return {
      SwitchStatement(node) {
        if (!scopeIndex.isInServerScope(node, options)) return
        const tsNode = services.esTreeNodeToTSNodeMap.get(node.discriminant)
        if (!tsNode) return
        const type = checker.getTypeAtLocation(tsNode)
        const kind = getNumericKind(checker, type)
        const isStr = isStringType(checker, type)
        if (kind !== 'int' && !isStr) {
          context.report({
            node: node.discriminant,
            message: formatMessage(
              options.lang,
              'switch 控制表达式必须是 int 或 str',
              'switch control expression must be int or str'
            )
          })
          return
        }

        let defaultCount = 0
        const cases = node.cases ?? []
        for (let i = 0; i < cases.length; i += 1) {
          const clause = cases[i]
          if (!clause.test) {
            defaultCount += 1
            if (defaultCount > 1) {
              context.report({
                node: clause,
                message: formatMessage(
                  options.lang,
                  'switch 不允许多个 default',
                  'switch has multiple default clauses'
                )
              })
            }
            continue
          }
          if (isStr && !isStringLiteral(clause.test)) {
            context.report({
              node: clause.test,
              message: formatMessage(
                options.lang,
                'switch case 表达式必须为字符串字面量',
                'switch case expression must be a string literal'
              )
            })
          }
          if (kind === 'int' && !isIntLiteral(clause.test)) {
            context.report({
              node: clause.test,
              message: formatMessage(
                options.lang,
                'switch case 表达式必须为整数/BigInt字面量',
                'switch case expression must be an integer literal'
              )
            })
          }
        }

        if (!options.allowFallthrough && cases.length > 1) {
          for (let i = 0; i < cases.length - 1; i += 1) {
            const clause = cases[i]
            if (!clause.consequent?.length) continue
            const last = lastNonEmptyStatement(clause.consequent)
            if (
              last &&
              last.type !== 'BreakStatement' &&
              last.type !== 'ReturnStatement' &&
              last.type !== 'ContinueStatement'
            ) {
              context.report({
                node: clause,
                message: formatMessage(
                  options.lang,
                  'switch 不支持带 body 的 fallthrough, 请添加 break/return/continue',
                  'switch fallthrough with body is not supported; add break/return/continue'
                )
              })
            }
          }
        }
      }
    }
  }
}

export default rule
