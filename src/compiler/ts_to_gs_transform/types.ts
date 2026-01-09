import type ts from 'typescript'

import type { DictValueType } from '../../runtime/value.js'
import type { GstsConfig, GstsFeatureFlags } from '../gsts_config.js'

export type TransformCtx = {
  checker: ts.TypeChecker
  config: GstsConfig
  timerCounterRef: { value: number }
}

export type TimerHandleMeta = {
  dicts: { name: string; valueType: DictValueType }[]
}

export type VarPlanEntry = {
  /**
   * 变量需要“局部变量语义”（Get/Set Local Variable）以模拟可变状态
   */
  needsLocalVar: boolean
  /**
   * 变量被判定为 collection（list/dict）
   */
  isCollection: boolean
}

export type VarPlan = ReadonlyMap<ts.Symbol, VarPlanEntry>

export type EnumImportInfo =
  | { kind: 'namespace'; name: string; isTypeOnly: boolean }
  | { kind: 'named'; name: string; hasRoundingMode: boolean; isTypeOnly: boolean }

export type Env = {
  gstsIdent: string
  config: GstsConfig
  /**
   * Whether current transform is inside server ctx (g.server().on / gstsServer*)
   */
  serverCtx?: boolean
  /**
   * Return handling mode for current function body.
   */
  returnMode?: 'handler' | 'value'
  /**
   * Block depth for return validation (0 = top-level function body).
   */
  returnDepth?: number
  breakName?: string
  breakKind?: 'loop' | 'switch'
  continueInfo?: {
    kind: 'doWhile'
    condition: ts.Expression
  }
  /**
   * handler 第一个参数（通常命名为 evt）
   */
  evtIdent?: string
  /**
   * handler 第二个参数（通常命名为 f），用于识别 f.xxx(...) 的调用属于节点 API
   */
  fIdent?: string
  /**
   * loop index symbols (for numeric coercion of finiteLoop currentLoopValue)
   */
  loopIndexSymbols?: Set<ts.Symbol>
  file: ts.SourceFile
  checker: ts.TypeChecker
  loopMax: number
  tempCounter: number
  timerCounterRef: { value: number }
  features: GstsFeatureFlags
  varPlan?: VarPlan
  eventName?: string
  timerHandleMeta?: Map<ts.Symbol, TimerHandleMeta>
  enumImport?: EnumImportInfo
  needsEnumImportRef?: { value: boolean }
  localNames?: Set<string>
  localVarNames?: Set<string>
  localSymbols?: Set<ts.Symbol>
  localVarSymbols?: Set<ts.Symbol>
  shadowedNames?: Set<string>
}

export function buildFeatureFlags(cfg: GstsConfig): GstsFeatureFlags {
  return {
    whileCondition: true,
    doWhile: true,
    continue: false,
    switch: false,
    destructuring: false,
    ternary: false,
    nullishCoalesce: false,
    ...(cfg.options?.features ?? {})
  }
}
