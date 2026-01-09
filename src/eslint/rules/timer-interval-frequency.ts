import type { Rule } from 'eslint'

import { isIdentifier } from '../utils/ast.js'
import { formatMessage } from '../utils/messages.js'
import { readBaseOptions } from '../utils/options.js'
import { buildServerScopeIndex } from '../utils/scope.js'

type Options = {
  thresholdMs?: number
  lang?: 'zh' | 'en' | 'both'
  scope?: 'server' | 'all'
  includeNestedFunctions?: boolean
}

const DEFAULTS: Required<Options> = {
  thresholdMs: 100,
  lang: 'both',
  scope: 'server',
  includeNestedFunctions: true
}

function isSetIntervalCall(node: any): boolean {
  const callee = node.callee
  if (!callee) return false
  if (callee.type === 'Identifier' && callee.name === 'setInterval') return true
  if (callee.type === 'MemberExpression' && !callee.computed) {
    if (isIdentifier(callee.object, 'globalThis') && isIdentifier(callee.property)) {
      return callee.property.name === 'setInterval'
    }
  }
  return false
}

function readNumericLiteral(node: any): number | null {
  if (!node || node.type !== 'Literal') return null
  if (typeof node.value === 'number') return node.value
  if (typeof node.value === 'bigint') return Number(node.value)
  if (typeof node.bigint === 'string') return Number(node.bigint.replace(/_/g, ''))
  return null
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        properties: {
          thresholdMs: { type: 'number' },
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
    const scopeIndex = buildServerScopeIndex(context)

    return {
      CallExpression(node) {
        if (!scopeIndex.isInServerScope(node, options)) return
        if (!isSetIntervalCall(node)) return
        const delayArg = node.arguments[1]
        const ms = readNumericLiteral(delayArg)
        if (ms === null) return
        if (ms > options.thresholdMs) return
        context.report({
          node: delayArg,
          message: formatMessage(
            options.lang,
            '定时器频率过高可能影响性能',
            'Interval too frequent; may hurt performance'
          )
        })
      }
    }
  }
}

export default rule
