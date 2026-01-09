import type { Rule } from 'eslint'

import { isIdentifier } from '../utils/ast.js'
import { formatMessage } from '../utils/messages.js'
import { readBaseOptions } from '../utils/options.js'
import { buildServerScopeIndex } from '../utils/scope.js'

type Options = {
  maxParams?: number
  lang?: 'zh' | 'en' | 'both'
  scope?: 'server' | 'all'
  includeNestedFunctions?: boolean
}

const DEFAULTS: Required<Options> = {
  maxParams: 2,
  lang: 'both',
  scope: 'server',
  includeNestedFunctions: true
}

function isTimerCall(node: any): boolean {
  const callee = node.callee
  if (!callee) return false
  if (
    callee.type === 'Identifier' &&
    (callee.name === 'setTimeout' || callee.name === 'setInterval')
  ) {
    return true
  }
  if (callee.type === 'MemberExpression' && !callee.computed) {
    if (isIdentifier(callee.object, 'globalThis') && isIdentifier(callee.property)) {
      return callee.property.name === 'setTimeout' || callee.property.name === 'setInterval'
    }
  }
  return false
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        properties: {
          maxParams: { type: 'number' },
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

    const report = (node: any) => {
      context.report({
        node,
        message: formatMessage(
          options.lang,
          '定时器回调参数不符合要求',
          'Invalid timer callback signature'
        )
      })
    }

    return {
      CallExpression(node) {
        if (!scopeIndex.isInServerScope(node, options)) return
        if (!isTimerCall(node)) return
        const cb = node.arguments[0]
        if (!cb || (cb.type !== 'FunctionExpression' && cb.type !== 'ArrowFunctionExpression')) {
          report(node)
          return
        }
        if (cb.params.length > options.maxParams) {
          report(cb)
          return
        }
        const seen = new Set<string>()
        for (const param of cb.params) {
          if (param.type === 'RestElement' || param.type === 'AssignmentPattern') {
            report(param)
            return
          }
          if (param.type !== 'Identifier') {
            report(param)
            return
          }
          if (seen.has(param.name)) {
            report(param)
            return
          }
          seen.add(param.name)
        }
      }
    }
  }
}

export default rule
