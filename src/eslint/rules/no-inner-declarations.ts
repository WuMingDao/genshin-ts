import type { Rule } from 'eslint'

import { formatMessage } from '../utils/messages.js'
import { readBaseOptions } from '../utils/options.js'
import { buildServerScopeIndex } from '../utils/scope.js'

type Options = {
  lang?: 'zh' | 'en' | 'both'
  scope?: 'server' | 'all'
  includeNestedFunctions?: boolean
}

const DEFAULTS: Required<Options> = {
  lang: 'both',
  scope: 'server',
  includeNestedFunctions: true
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        properties: {
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
    const message = formatMessage(
      options.lang,
      '回调内部不支持函数/类声明, 请移到外部并使用 gstsServer* 前缀',
      'Function/class declarations inside callbacks are not supported, please move them outside and use gstsServer* prefix'
    )

    const check = (node: any) => {
      if (!scopeIndex.isInServerScope(node, options)) return
      if (
        node.parent?.type === 'Program' ||
        node.parent?.type === 'ExportNamedDeclaration' ||
        node.parent?.type === 'ExportDefaultDeclaration'
      ) {
        return
      }
      context.report({ node, message })
    }

    return {
      FunctionDeclaration: check,
      ClassDeclaration: check
    }
  }
}

export default rule
