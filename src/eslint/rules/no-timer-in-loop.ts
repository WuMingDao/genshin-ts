import type { Rule } from 'eslint'

import { isIdentifier } from '../utils/ast.js'
import { formatMessage } from '../utils/messages.js'
import { readBaseOptions } from '../utils/options.js'
import { buildServerScopeIndex } from '../utils/scope.js'

type Options = {
  timerMethods?: string[]
  lang?: 'zh' | 'en' | 'both'
  scope?: 'server' | 'all'
  includeNestedFunctions?: boolean
}

const DEFAULTS: Required<Options> = {
  timerMethods: ['setTimeout', 'setInterval'],
  lang: 'both',
  scope: 'server',
  includeNestedFunctions: true
}

function isInLoop(node: any): boolean {
  let cur = node.parent
  while (cur) {
    if (
      cur.type === 'ForStatement' ||
      cur.type === 'ForOfStatement' ||
      cur.type === 'ForInStatement' ||
      cur.type === 'WhileStatement' ||
      cur.type === 'DoWhileStatement'
    ) {
      return true
    }
    if (
      cur.type === 'FunctionDeclaration' ||
      cur.type === 'FunctionExpression' ||
      cur.type === 'ArrowFunctionExpression'
    ) {
      return false
    }
    cur = cur.parent
  }
  return false
}

function isTimerCall(node: any, methods: Set<string>): boolean {
  const callee = node.callee
  if (!callee) return false
  if (callee.type === 'Identifier' && methods.has(callee.name)) return true
  if (callee.type === 'MemberExpression' && !callee.computed) {
    if (isIdentifier(callee.object, 'globalThis') && isIdentifier(callee.property)) {
      return methods.has(callee.property.name)
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
          timerMethods: { type: 'array', items: { type: 'string' } },
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
    const methods = new Set(options.timerMethods)

    return {
      CallExpression(node) {
        if (!scopeIndex.isInServerScope(node, options)) return
        if (!isTimerCall(node, methods)) return
        if (!isInLoop(node)) return
        context.report({
          node,
          message: formatMessage(
            options.lang,
            '通常循环中使用定时器是危险的, 如果确实有需求, 你可能需要适当调整GstsConfig.options.optimize.timerPool',
            'Timers inside loops are risky; consider adjusting `GstsConfig.options.optimize.timerPool` if you have specific requirements'
          )
        })
      }
    }
  }
}

export default rule
