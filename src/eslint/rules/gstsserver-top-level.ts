import type { Rule } from 'eslint'

import { formatMessage } from '../utils/messages.js'
import { readBaseOptions } from '../utils/options.js'
import { DEFAULT_GSTS_SERVER_PREFIX, isGstsServerName } from '../utils/ts_matchers.js'

type Options = {
  prefixes?: string[]
  lang?: 'zh' | 'en' | 'both'
}

const DEFAULTS: Required<Options> = {
  prefixes: [DEFAULT_GSTS_SERVER_PREFIX],
  lang: 'both'
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        properties: {
          prefixes: { type: 'array', items: { type: 'string' } },
          lang: { enum: ['zh', 'en', 'both'] }
        },
        additionalProperties: false
      }
    ]
  },
  create(context) {
    const raw = (context.options[0] ?? {}) as Options
    const options = readBaseOptions(raw, DEFAULTS)
    const report = (node: any, message: string) => {
      context.report({ node, message })
    }
    const msg = formatMessage(
      options.lang,
      'gstsServer函数必须顶层声明',
      'gstsServer functions must be declared at top level'
    )
    const msgInit = formatMessage(
      options.lang,
      'gstsServer函数必须使用函数初始化',
      'gstsServer functions must be declared with a function initializer'
    )
    const msgAssign = formatMessage(
      options.lang,
      'gstsServer不支持赋值, 请声明顶层函数',
      'gstsServer assignment is not supported; declare a top-level function'
    )

    return {
      FunctionDeclaration(node) {
        if (!isGstsServerName(node.id?.name, options.prefixes)) return
        if (
          node.parent?.type !== 'Program' &&
          node.parent?.type !== 'ExportNamedDeclaration' &&
          node.parent?.type !== 'ExportDefaultDeclaration'
        )
          report(node, msg)
      },
      VariableDeclarator(node) {
        if (!node.id || node.id.type !== 'Identifier') return
        if (!isGstsServerName(node.id.name, options.prefixes)) return
        const decl = node.parent
        const parent = decl?.parent
        if (
          parent?.type !== 'Program' &&
          parent?.type !== 'ExportNamedDeclaration' &&
          parent?.type !== 'ExportDefaultDeclaration'
        ) {
          report(node, msg)
        }
        if (
          !node.init ||
          (node.init.type !== 'FunctionExpression' && node.init.type !== 'ArrowFunctionExpression')
        ) {
          report(node, msgInit)
        }
      },
      AssignmentExpression(node) {
        if (node.left?.type !== 'Identifier') return
        if (!isGstsServerName(node.left.name, options.prefixes)) return
        report(node, msgAssign)
      }
    }
  }
}

export default rule
