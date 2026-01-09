import { EnumerationType } from '../definitions/enum.js'
import { ServerEventPayloads } from '../definitions/events-payload.js'
import {
  ServerEventMetadata,
  ServerEventMetadataType,
  ServerEventName
} from '../definitions/events.js'
import { ServerExecutionFlowFunctions } from '../definitions/nodes.js'
import type { ServerOnOverloads } from '../definitions/server_on_overloads.js'
import {
  SERVER_EVENT_ZH_TO_EN,
  SERVER_F_ZH_TO_EN,
  type ServerEventNameZh
} from '../definitions/zh_aliases.js'
import type { ExecTailEndpoint, ExecutionFlow } from './execution_flow_types.js'
import { buildIRDocument } from './ir_builder.js'
import type { ServerGraphSubType, Variable } from './IR.js'
import type { MetaCallRecord, MetaCallRecordRef } from './meta_call_types.js'
import { getRuntimeOptions } from './runtime_config.js'
import { installScopedServerGlobals, installServerGlobals } from './server_globals.js'
import {
  bool,
  dict,
  ensureLiteralStr,
  enumeration,
  list,
  localVariable,
  value,
  type DictValueType
} from './value.js'
import {
  parseVariableDefinitions,
  type NodeGraphVarApi,
  type NodeGraphVariableMeta,
  type VariablesDefinition
} from './variables.js'

export type { MetaCallRecord, MetaCallRecordRef, MetaCallRecordType } from './meta_call_types.js'

export type IRBuildOptions = {
  optimizeA?: boolean
  /**
   * [ZH] 默认图名（当 g.server 未指定 name 时使用；通常由 runner 传入入口文件名）
   *
   * [EN] Default graph name when g.server() doesn't provide one (usually from runner entry filename)
   */
  defaultName?: string
}

export type ServerLang = 'en' | 'zh'

export type ServerGraphOptions<Vars extends VariablesDefinition = VariablesDefinition> = {
  /**
   * [ZH] 服务器节点图子类型（默认 `实体节点图`）。
   *
   * [EN] Server graph sub type (default: `entity`).
   */
  type?: ServerGraphSubType
  /**
   * [ZH] 节点图 ID（NodeGraph.id）。
   *
   * 对应要注入/替换的目标 NodeGraph ID。 起始值为 1073741825
   *
   * [EN] Node graph id (NodeGraph.id).
   *
   * The target NodeGraph id to inject/replace. The default value is 1073741825.
   */
  id?: number
  /**
   * [ZH] 节点图显示名称（NodeGraph.name）。
   *
   * 若不指定：默认使用入口文件名（由 gsts runner 注入 defaultName）。
   *
   * [EN] Display name inside the node editor (NodeGraph.name).
   *
   * If omitted: defaults to the entry file name (provided by gsts runner as defaultName).
   */
  name?: string
  /**
   * [ZH] 是否自动加 `_GSTS` 前缀（默认 true）。
   * - true: 若 name/defaultName 不以 `_GSTS` 开头，则自动补 `_GSTS_` 前缀
   * - false: 不做任何前缀处理
   *
   * [EN] Whether to auto prefix with `_GSTS` (default true).
   */
  prefix?: boolean
  /**
   * [ZH] 节点图变量声明
   *
   * [EN] Node graph variable definitions
   */
  variables?: Vars
  /**
   * [ZH] 语言偏好（仅影响类型提示与中文别名解析）
   *
   * [EN] Language hint (affects type hints and zh alias resolution only)
   */
  lang?: ServerLang
}

export type ServerExecutionFlowFunctionsWithVars<Vars extends VariablesDefinition> = Omit<
  ServerExecutionFlowFunctions,
  'get' | 'set'
> &
  NodeGraphVarApi<Vars>

export type ServerExecutionFlowFunctionsWithVarsZh<Vars extends VariablesDefinition> =
  ServerExecutionFlowFunctionsWithVars<Vars> & {
    [K in keyof typeof SERVER_F_ZH_TO_EN]: ServerExecutionFlowFunctionsWithVars<Vars>[(typeof SERVER_F_ZH_TO_EN)[K]]
  }

type ServerExecutionFlowFunctionsForLang<
  Vars extends VariablesDefinition,
  Lang extends ServerLang
> = Lang extends 'zh'
  ? ServerExecutionFlowFunctionsWithVarsZh<Vars>
  : ServerExecutionFlowFunctionsWithVars<Vars>

type ServerEventNameAny = ServerEventName | ServerEventNameZh

type ServerEventNameToEn<E> = E extends ServerEventName
  ? E
  : E extends ServerEventNameZh
    ? (typeof SERVER_EVENT_ZH_TO_EN)[E]
    : never

interface ServerOnOverloadsZh<Vars extends VariablesDefinition, F> {
  on<E extends ServerEventNameAny>(
    eventName: E,
    handler: (evt: ServerEventPayloads[ServerEventNameToEn<E>], f: F) => void
  ): this
}

export type ServerGraphApi<
  Vars extends VariablesDefinition,
  Lang extends ServerLang = 'en'
> = (Lang extends 'zh'
  ? ServerOnOverloads<Vars, ServerExecutionFlowFunctionsForLang<Vars, 'zh'>> &
      ServerOnOverloadsZh<Vars, ServerExecutionFlowFunctionsForLang<Vars, 'zh'>>
  : ServerOnOverloads<Vars, ServerExecutionFlowFunctionsForLang<Vars, 'en'>>) & {
  /**
   * Monitors Signal trigger events defined in the Signal Manager; The Signal name to monitor must be selected first
   *
   * 监听信号: 监听已在信号管理器中定义的信号触发事件; 需先选择需要监听的信号名
   *
   * GSTS Note: You still need to register the signal in the signal manager in the editor; Using signal distribution can avoid some large loop triggering load limits, which can be used for performance optimization
   *
   * GSTS 注: 你仍然需要在编辑器内的信号管理器注册信号; 使用信号分发能够避免一些大循环触发负载限制, 可用于性能优化
   */
  onSignal(
    signalName: string,
    handler: (
      evt: ServerEventPayloads['monitorSignal'],
      f: ServerExecutionFlowFunctionsForLang<Vars, Lang>
    ) => void
  ): ServerGraphApi<Vars, Lang>
}

const SERVER_GRAPH_TYPES = new Set<ServerGraphSubType>(['entity', 'status', 'class', 'item'])

function resolveServerGraphType(type?: ServerGraphSubType): ServerGraphSubType {
  const resolved = type ?? 'entity'
  if (!SERVER_GRAPH_TYPES.has(resolved)) {
    throw new Error(`[error] invalid server graph sub type: ${String(type)}`)
  }
  return resolved
}

export type GstsCtxType =
  | 'javascript'
  | 'server_handler'
  | 'server_if'
  | 'server_loop'
  | 'server_switch'

export type GstsCtxApi = {
  readonly ctxType: GstsCtxType
  withCtx<T>(ctxType: GstsCtxType, fn: () => T): T
  isServerCtx(): boolean
  assertServerCtx(): void
  assertCtx(expected: GstsCtxType): void
}

export type GstsPublic = {
  /**
   * context tools entry
   *
   * 上下文工具统一入口
   */
  readonly ctx: GstsCtxApi
  /**
   * only available in g.server().on() handler
   *
   * 仅允许在 g.server().on() 下访问，否则 throw
   */
  readonly f: ServerExecutionFlowFunctions
}

declare global {
  var gsts: GstsPublic
  interface GlobalThis {
    gsts: GstsPublic
  }
}

const kCtxStack: unique symbol = Symbol('gsts_ctxStack')
const kServerF: unique symbol = Symbol('gsts_serverF')

type GstsInternal = GstsPublic & {
  [kCtxStack]?: GstsCtxType[]
  [kServerF]?: ServerExecutionFlowFunctions
}

function ensureGsts(): GstsPublic {
  // @ts-ignore 友好打印bigint
  BigInt.prototype.toJSON = function () {
    return `${Number(this)}n`
  }

  const root = globalThis as unknown as { gsts?: GstsInternal }
  const g = (root.gsts ??= { ctx: {} as unknown as GstsCtxApi } as GstsInternal)

  const stack = (g[kCtxStack] ??= [])

  const ctx: GstsCtxApi = {
    get ctxType() {
      return stack[stack.length - 1] ?? 'javascript'
    },
    withCtx<T>(ctxType: GstsCtxType, fn: () => T): T {
      stack.push(ctxType)
      try {
        return fn()
      } finally {
        stack.pop()
      }
    },
    isServerCtx() {
      return this.ctxType.startsWith('server_')
    },
    assertServerCtx() {
      if (!this.isServerCtx()) {
        throw new Error(
          `[error] gsts.f is only available in server_* ctxType (current: ${this.ctxType})`
        )
      }
    },
    assertCtx(expected: GstsCtxType) {
      if (this.ctxType !== expected) {
        throw new Error(`[error] invalid ctxType: expected ${expected}, got ${this.ctxType}`)
      }
    }
  }
  // @ts-ignore force assign ctx to gsts
  g.ctx = ctx

  if (!Object.getOwnPropertyDescriptor(g, 'f')) {
    Object.defineProperty(g, 'f', {
      configurable: false,
      enumerable: true,
      get() {
        ctx.assertServerCtx()
        if (!g[kServerF]) {
          throw new Error(
            '[error] gsts.f is not bound (did you call it outside g.server().on handler?)'
          )
        }
        return g[kServerF]
      }
    })
  }

  return g
}

ensureGsts()
installServerGlobals()

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function processDictParam(param: ServerEventMetadataType[ServerEventName][number]): value {
  switch (param.name) {
    case 'purchaseItemDictionary':
      return new dict('config_id', 'int')
    default:
      throw new Error(`Unknown dict param: ${param.name}`)
  }
}

export class MetaCallRegistry {
  private recordCounter = 1
  private flows: ExecutionFlow[] = []
  private flowStack: number[] = []
  private readonly graphType: ServerGraphSubType
  private readonly graphId?: number
  private readonly graphName?: string
  private readonly prefixName: boolean
  private readonly variables: Variable[]
  private readonly variableMetaByName: Map<string, NodeGraphVariableMeta>
  private bootstrapFlow?: ExecutionFlow
  /**
   * return调用计数, 通过回调前后比对确认是否调用过return
   */
  private returnCallCounter = 0
  /**
   * 用于记录当前活跃的循环体节点, 方便return时全部break
   */
  private loopNodeStack: number[] = []

  constructor(
    graphType: ServerGraphSubType = 'entity',
    graphId?: number,
    graphName?: string,
    prefixName: boolean = true,
    variables: Variable[] = [],
    variableMetaByName: Map<string, NodeGraphVariableMeta> = new Map()
  ) {
    this.graphType = graphType
    this.graphId = graphId
    this.graphName = graphName
    this.prefixName = prefixName
    this.variables = variables
    this.variableMetaByName = variableMetaByName
  }

  ensureBootstrapFlow(): ExecutionFlow {
    if (this.bootstrapFlow) return this.bootstrapFlow
    if (this.recordCounter !== 1) {
      throw new Error('[error] bootstrap flow must be created before any other nodes')
    }
    this.registerEvent('whenEntityIsCreated', ServerEventMetadata, [])
    const flow = this.flows[this.flows.length - 1]
    this.bootstrapFlow = flow
    return flow
  }

  withFlow<T>(flow: ExecutionFlow, fn: () => T): T {
    const idx = this.flows.indexOf(flow)
    if (idx < 0) {
      throw new Error('[error] flow not found')
    }
    const prevFlowStack = this.flowStack
    this.flowStack = [...prevFlowStack, idx]
    try {
      return fn()
    } finally {
      this.flowStack = prevFlowStack
    }
  }

  ensureVariable(variable: Variable, meta?: NodeGraphVariableMeta) {
    const existing = this.variables.find((v) => v.name === variable.name)
    if (existing) {
      if (existing.type !== variable.type) {
        throw new Error(
          `[error] variable "${variable.name}" already exists with different type (${existing.type} vs ${variable.type})`
        )
      }
      if (existing.type === 'dict') {
        const a = existing.dict
        const b = (variable as Extract<Variable, { type: 'dict' }>).dict
        if (!a || !b || a.k !== b.k || a.v !== b.v) {
          throw new Error(
            `[error] variable "${variable.name}" already exists with different dict types`
          )
        }
      }
      return
    }
    this.variables.push(variable)
    if (meta) this.variableMetaByName.set(variable.name, meta)
  }

  registerTimerCaptureDict(name: string, valueType: DictValueType) {
    this.ensureVariable(
      { name, type: 'dict', dict: { k: 'str', v: valueType } },
      { type: 'dict', dict: { k: 'str', v: valueType } }
    )
  }

  runServerHandler<E extends ServerEventName>(
    eventName: E,
    handler: (evt: ServerEventPayloads[E], f: ServerExecutionFlowFunctions) => void,
    inputArgs: value[] = []
  ) {
    this.ensureBootstrapFlow()
    const evt = this.registerEvent(eventName, ServerEventMetadata, inputArgs)
    const fns = new ServerExecutionFlowFunctions(this)
    const gsts = ensureGsts() as unknown as GstsInternal
    const prevF = gsts[kServerF]
    const prevFlowStack = this.flowStack
    const prevLoopStack = this.loopNodeStack
    const prevReturnCounter = this.returnCallCounter
    const flowIndex = this.flows.length - 1
    const restoreScopedGlobals = installScopedServerGlobals()
    this.flowStack = [...prevFlowStack, flowIndex]
    this.loopNodeStack = []
    this.returnCallCounter = 0
    gsts[kServerF] = fns
    try {
      gsts.ctx.withCtx('server_handler', () => handler(evt, fns as never))
    } finally {
      restoreScopedGlobals()
      gsts[kServerF] = prevF
      this.flowStack = prevFlowStack
      this.loopNodeStack = prevLoopStack
      this.returnCallCounter = prevReturnCounter
    }
  }

  getGraphId(): number | undefined {
    return this.graphId
  }

  getGraphName(): string | undefined {
    return this.graphName
  }

  shouldPrefixName(): boolean {
    return this.prefixName
  }

  private getCurrentExecContext(flow: ExecutionFlow) {
    return flow.execContextStack[flow.execContextStack.length - 1]
  }

  private addEdge(flow: ExecutionFlow, fromNodeId: number, toNodeId: number, sourceIndex?: number) {
    const list = (flow.edges[fromNodeId] ??= [])
    if (sourceIndex === undefined) {
      list.push(toNodeId)
    } else {
      list.push({ node_id: toNodeId, source_index: sourceIndex })
    }
  }

  private connectFromEndpoints(
    flow: ExecutionFlow,
    endpoints: ExecTailEndpoint[],
    toNodeId: number
  ) {
    endpoints.forEach((ep) => this.addEdge(flow, ep.nodeId, toNodeId, ep.sourceIndex))
  }

  connectExecBranchOutput(fromNodeId: number, sourceIndex: number, headNodeId: number) {
    this.addEdge(this.currentFlow, fromNodeId, headNodeId, sourceIndex)
  }

  private get currentFlow(): ExecutionFlow {
    const idx =
      this.flowStack.length > 0 ? this.flowStack[this.flowStack.length - 1] : this.flows.length - 1
    return this.flows[idx]
  }

  /**
   * 获取当前记录的 ID，每次调用后递增
   */
  private get currentRecordId(): number {
    return this.recordCounter++
  }

  registerEvent<E extends ServerEventName>(
    eventName: E,
    metadata: ServerEventMetadataType,
    inputArgs: value[] = []
  ): ServerEventPayloads[E] {
    const eventParams = metadata[eventName]

    if (!eventParams) {
      throw new Error(`Unknown event: ${eventName}`)
    }

    const eventNode: MetaCallRecord = {
      id: this.currentRecordId,
      type: 'event',
      nodeType: camelToSnake(eventName),
      args: inputArgs
    }

    const eventArgs: value[] = []
    const eventObj = {} as unknown as ServerEventPayloads[E]

    eventParams.forEach((param) => {
      const makePin = () => {
        if (param.typeBase === dict) {
          const v = processDictParam(param)
          v.markPin(eventNode, param.name, eventArgs.length)
          return v
        }
        if (param.typeBase === enumeration) {
          const v = new enumeration(param.typeName as EnumerationType)
          v.markPin(eventNode, param.name, eventArgs.length)
          return v
        }
        const v = new (param.typeBase as Exclude<typeof param.typeBase, typeof dict>)()
        v.markPin(eventNode, param.name, eventArgs.length)
        return v
      }
      if (param.isArray) {
        const l = new list(param.typeName)
        l.markPin(eventNode, param.name, eventArgs.length)
        eventArgs.push(l)
        // @ts-ignore 强制允许
        eventObj[param.name] = l
      } else {
        const arg = makePin()
        eventArgs.push(arg)
        // @ts-ignore 强制允许
        eventObj[param.name] = arg
      }
    })

    this.flows.push({
      eventNode,
      eventArgs,
      execNodes: [],
      dataNodes: [],
      edges: {},
      execContextStack: [
        {
          // 默认根执行链从事件节点出发
          tailEndpoints: [{ nodeId: eventNode.id }]
        }
      ]
    })

    return eventObj
  }

  /**
   * 在指定节点的某个执行输出引脚下注册一段执行链（用于循环体/条件分支）。
   * 回调内注册的 exec 节点会形成一条独立链，结束后自动把该链的 head 挂到 fromNodeId 的 sourceIndex 上。
   */
  withExecBranch(fromNodeId: number, sourceIndex: number, fn: () => void) {
    const current = this.currentFlow
    current.execContextStack.push({ tailEndpoints: [] })

    fn()

    const ctx = current.execContextStack.pop()!
    // fn注册过节点, 则headNodeId才会有值
    if (ctx.headNodeId) {
      this.addEdge(current, fromNodeId, ctx.headNodeId, sourceIndex)
    }

    return {
      tailEndpoints: ctx.tailEndpoints,
      headNodeId: ctx.headNodeId,
      terminatedByReturn: ctx.terminatedByReturn
    }
  }

  /**
   * 标记, 将“接下来注册到的第一个 exec 节点”挂到指定节点的某个执行输出引脚上（一次性）。
   * 用于像 Finite Loop 的 Loop Complete：循环节点后的顺序代码应连接到 complete 分支。
   */
  markLinkNextExecFrom(fromNodeId: number, sourceIndex: number) {
    const current = this.currentFlow
    const ctx = this.getCurrentExecContext(current)
    ctx.tailEndpoints = [{ nodeId: fromNodeId, sourceIndex }]
    ctx.pendingSourceIndex = sourceIndex
  }

  /**
   * 设置当前执行链 tail (多路时用)
   */
  setCurrentExecTailEndpoints(tailEndpoints: ExecTailEndpoint[]) {
    const current = this.currentFlow
    const ctx = this.getCurrentExecContext(current)
    ctx.tailEndpoints = tailEndpoints
    ctx.pendingSourceIndex = undefined
  }

  /**
   * 终止当前执行路径（return / continue / break 语义）：该分支后续不再产生执行连线
   */
  returnFromCurrentExecPath(opts?: { countReturn?: boolean }) {
    const current = this.currentFlow
    const ctx = this.getCurrentExecContext(current)
    ctx.terminatedByReturn = true
    ctx.tailEndpoints = []
    ctx.pendingSourceIndex = undefined
    if (opts?.countReturn !== false) this.returnCallCounter += 1
  }

  registerNode(record: MetaCallRecord): MetaCallRecordRef {
    const current = this.currentFlow
    if (!record.id) {
      record.id = this.currentRecordId
    }

    if (record.type === 'exec') {
      current.execNodes.push(record)
      const ctx = this.getCurrentExecContext(current)
      if (!ctx.headNodeId) ctx.headNodeId = record.id
      const tails = ctx.tailEndpoints
      if (ctx.pendingSourceIndex !== undefined && tails.length > 1) {
        throw new Error('pendingSourceIndex cannot be used with multiple tail endpoints')
      }
      if (tails.length) {
        const sourceIndex = ctx.pendingSourceIndex
        if (sourceIndex !== undefined) {
          this.connectFromEndpoints(current, [{ nodeId: tails[0].nodeId, sourceIndex }], record.id)
        } else {
          this.connectFromEndpoints(current, tails, record.id)
        }
        ctx.pendingSourceIndex = undefined
      }
      ctx.tailEndpoints = [{ nodeId: record.id }]
    } else if (record.type === 'data') {
      current.dataNodes.push(record)
    } else {
      throw new Error(`registerNode: unknown record type: ${record.type}`)
    }
    return record
  }

  getFlows(): ExecutionFlow[] {
    return this.flows
  }

  getVariables() {
    return this.variables
  }

  getVariableMeta(name: string): NodeGraphVariableMeta | undefined {
    return this.variableMetaByName.get(name)
  }

  getGraphType(): ServerGraphSubType {
    return this.graphType
  }

  /**
   * 获取当前 flow 的 return gate 局部变量（不存在则创建：Get Local Variable(false)）。
   * 用于：return() 标记 + 循环 complete 处的 return gate。
   */
  getOrCreateReturnGateLocalVariable(): { localVariable: localVariable; value: bool } {
    const flow = this.currentFlow
    if (flow.returnGateLocalVariable && flow.returnGateValue) {
      return {
        localVariable: flow.returnGateLocalVariable as localVariable,
        value: flow.returnGateValue as bool
      }
    }

    const ref = this.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_local_variable',
      args: [new bool(false)]
    })
    const lv = new localVariable()
    lv.markPin(ref, 'localVariable', 0)
    const v = new bool()
    v.markPin(ref, 'value', 1)

    flow.returnGateLocalVariable = lv
    flow.returnGateValue = v
    return { localVariable: lv, value: v }
  }

  withLoop(loopNodeId: number, fn: () => void) {
    this.loopNodeStack.push(loopNodeId)

    fn()

    this.loopNodeStack.pop()
  }

  getActiveLoopNodeIds(): number[] {
    return [...this.loopNodeStack]
  }

  getReturnCallCounter(): number {
    return this.returnCallCounter
  }
}

const serverRegistries: MetaCallRegistry[] = []

function server<Vars extends VariablesDefinition = VariablesDefinition>(
  options: ServerGraphOptions<Vars> & { lang: 'zh' }
): ServerGraphApi<Vars, 'zh'>
function server<Vars extends VariablesDefinition = VariablesDefinition>(
  options?: ServerGraphOptions<Vars>
): ServerGraphApi<Vars, 'en'>
function server<Vars extends VariablesDefinition = VariablesDefinition>(
  options?: ServerGraphOptions<Vars>
) {
  type ResolvedLang = ServerLang
  const graphType = resolveServerGraphType(options?.type)
  const lang = options?.lang ?? 'en'
  const useZhAliases = lang === 'zh'
  const { variables, metaByName } = parseVariableDefinitions(options?.variables)
  const registry = new MetaCallRegistry(
    graphType,
    options?.id,
    options?.name,
    options?.prefix !== false,
    variables,
    metaByName
  )
  serverRegistries.push(registry)
  const resolveEventName = (eventName: ServerEventNameAny): ServerEventName => {
    if (!useZhAliases) return eventName as ServerEventName
    return (
      (SERVER_EVENT_ZH_TO_EN as Record<string, ServerEventName>)[eventName as string] ??
      (eventName as ServerEventName)
    )
  }

  const applyZhAliases = (fns: ServerExecutionFlowFunctions) => {
    const target = fns as unknown as Record<string, unknown>
    for (const [zhName, enName] of Object.entries(SERVER_F_ZH_TO_EN)) {
      if (Object.prototype.hasOwnProperty.call(target, zhName)) continue
      const fn = (target[enName] as (...args: unknown[]) => unknown) ?? undefined
      if (typeof fn !== 'function') continue
      Object.defineProperty(target, zhName, {
        value: fn,
        writable: false,
        configurable: false,
        enumerable: false
      })
    }
  }

  const runHandler = <E extends ServerEventNameAny>(
    eventName: E,
    handler: (
      evt: ServerEventPayloads[ServerEventNameToEn<E>],
      f: ServerExecutionFlowFunctionsForLang<Vars, ResolvedLang>
    ) => void,
    inputArgs: value[] = []
  ) => {
    const resolvedEventName = resolveEventName(eventName) as ServerEventNameToEn<E>
    const wrappedHandler = (
      evt: ServerEventPayloads[ServerEventNameToEn<E>],
      f: ServerExecutionFlowFunctions
    ) => {
      if (useZhAliases) applyZhAliases(f)
      handler(evt, f as unknown as ServerExecutionFlowFunctionsForLang<Vars, ResolvedLang>)
    }
    registry.runServerHandler(resolvedEventName, wrappedHandler, inputArgs)
  }

  const api = {
    on<E extends ServerEventNameAny>(
      eventName: E,
      handler: (
        evt: ServerEventPayloads[ServerEventNameToEn<E>],
        f: ServerExecutionFlowFunctionsForLang<Vars, ResolvedLang>
      ) => void
    ) {
      runHandler(eventName, handler)
      return this
    },
    onSignal(
      signalName: string,
      handler: (
        evt: ServerEventPayloads['monitorSignal'],
        f: ServerExecutionFlowFunctionsForLang<Vars, ResolvedLang>
      ) => void
    ) {
      const signalNameObj = ensureLiteralStr(signalName, 'signalName')
      runHandler('monitorSignal', handler, [signalNameObj])
      return this
    }
  }
  return api as ServerGraphApi<Vars, ResolvedLang>
}

export const g = {
  server
}

export function printServerGraphRegistries() {
  console.log(JSON.stringify(serverRegistries, null, 2))
}

function removeUnusedNodesFromFlow(flow: ExecutionFlow): ExecutionFlow | null {
  const execById = new Map<number, MetaCallRecord>()
  const dataById = new Map<number, MetaCallRecord>()
  flow.execNodes.forEach((n) => execById.set(n.id, n))
  flow.dataNodes.forEach((n) => dataById.set(n.id, n))

  const reachableExecIds = new Set<number>()
  const visited = new Set<number>([flow.eventNode.id])
  const queue: number[] = [flow.eventNode.id]

  while (queue.length) {
    const current = queue.shift()!
    const nextList = flow.edges[current] ?? []
    nextList.forEach((conn) => {
      const targetId = typeof conn === 'number' ? conn : conn.node_id
      if (!visited.has(targetId)) {
        visited.add(targetId)
        queue.push(targetId)
      }
      if (execById.has(targetId)) reachableExecIds.add(targetId)
    })
  }

  if (reachableExecIds.size === 0) {
    return null
  }

  const usedDataIds = new Set<number>()
  const dataQueue: number[] = []
  const enqueueData = (id: number) => {
    if (usedDataIds.has(id)) return
    usedDataIds.add(id)
    dataQueue.push(id)
  }

  const collectDataDeps = (record: MetaCallRecord) => {
    for (const arg of record.args) {
      const meta = arg.getMetadata()
      if (!meta || meta.kind !== 'pin') continue
      const depId = meta.record.id
      if (dataById.has(depId)) enqueueData(depId)
    }
  }

  reachableExecIds.forEach((id) => {
    const record = execById.get(id)
    if (record) collectDataDeps(record)
  })

  while (dataQueue.length) {
    const id = dataQueue.shift()!
    const record = dataById.get(id)
    if (record) collectDataDeps(record)
  }

  const filteredExecNodes = flow.execNodes.filter((n) => reachableExecIds.has(n.id))
  const filteredDataNodes = flow.dataNodes.filter((n) => usedDataIds.has(n.id))
  const allowedFromIds = new Set<number>([flow.eventNode.id, ...reachableExecIds])
  const filteredEdges: typeof flow.edges = {}

  for (const [fromIdRaw, nextList] of Object.entries(flow.edges)) {
    const fromId = Number(fromIdRaw)
    if (!allowedFromIds.has(fromId)) continue
    const filteredNext = nextList.filter((conn) =>
      reachableExecIds.has(typeof conn === 'number' ? conn : conn.node_id)
    )
    if (filteredNext.length) filteredEdges[fromId] = filteredNext
  }

  return {
    ...flow,
    execNodes: filteredExecNodes,
    dataNodes: filteredDataNodes,
    edges: filteredEdges
  }
}

export function buildServerGraphRegistriesIRDocuments(opts: IRBuildOptions = {}) {
  const removeUnusedNodes = getRuntimeOptions().optimize.removeUnusedNodes
  const prefixName = (raw: string, enable: boolean) => {
    if (!enable) return raw
    if (raw.startsWith('_GSTS')) return raw
    return `_GSTS_${raw}`
  }

  const resolveName = (registry: MetaCallRegistry): string | undefined => {
    const raw = registry.getGraphName()
    if (typeof raw === 'string' && raw.length) return prefixName(raw, registry.shouldPrefixName())
    const def = opts.defaultName
    if (typeof def === 'string' && def.length) return prefixName(def, registry.shouldPrefixName())
    return '_GSTS_Generated_Graph'
  }

  const list = serverRegistries.map((registry) => {
    const flows = registry.getFlows()
    const optimizedFlows = removeUnusedNodes
      ? flows.map(removeUnusedNodesFromFlow).filter((flow) => flow !== null)
      : flows
    return buildIRDocument({
      flows: optimizedFlows,
      variables: registry.getVariables(),
      serverSubType: registry.getGraphType(),
      graphId: registry.getGraphId(),
      graphName: resolveName(registry)
    })
  })
  return list
}
