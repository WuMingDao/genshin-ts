import tsparser from '@typescript-eslint/parser'
import gsts from 'genshin-ts/eslint'
import { gstsDslGlobals } from 'genshin-ts/eslint.globals.mjs'

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: true
      },
      globals: {
        ...gstsDslGlobals
      }
    },
    plugins: {
      gsts
    },
    rules: {
      ...gsts.configs.recommended.rules,
      'prefer-const': 'off'
    }
  }
]
