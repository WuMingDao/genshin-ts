import type { PlayerEntity, StageEntity } from '../definitions/entity_helpers.js'
import type { ServerEventPayloads } from '../definitions/events-payload.js'
import type { ServerExecutionFlowFunctions } from '../definitions/nodes.js'
import type {
  BoolValue,
  configId,
  ConfigIdValue,
  DictKeyType,
  DictValueType,
  entity,
  EntityValue,
  faction,
  FactionValue,
  FloatValue,
  guid,
  GuidValue,
  IntValue,
  prefabId,
  PrefabIdValue,
  ReadonlyDict,
  RuntimeParameterValueTypeMap,
  RuntimeReturnValueTypeMap,
  StrValue,
  vec3,
  Vec3Value
} from './value.js'

declare global {
  /**
   * Returns the original value as a JavaScript expression, the compiler does not perform any processing
   *
   * 返回js原生表达式结果, 编译器不做任何处理
   */
  function raw<T>(value: T): T

  function bool(value: BoolValue | IntValue): boolean
  function int(value: IntValue | BoolValue | FloatValue): bigint
  function float(value: FloatValue | IntValue): number
  function str(
    value:
      | StrValue
      | BoolValue
      | IntValue
      | FloatValue
      | GuidValue
      | EntityValue
      | FactionValue
      | Vec3Value
  ): string
  function vec3(value: Vec3Value): vec3
  function guid(value: GuidValue): guid
  function prefabId(value: PrefabIdValue): prefabId
  function configId(value: ConfigIdValue): configId
  function faction(value: FactionValue): faction
  function entity(guidOrEntity: GuidValue | EntityValue): entity

  /**
   * Outputs a string to the log, generally used for logic checks and debugging; In the log, this string prints
   * whenever the logic runs successfully, regardless of whether this Node Graph is toggled
   *
   * 打印字符串: 可以在日志中输出一条字符串，一般用于逻辑检测和调试;
   * 在日志中，无论是否勾选了该节点图，逻辑成功运行时该字符串都会打印
   *
   * @param string The string to be printed
   *
   * 字符串: 所要打印的字符串
   */
  function print(string: StrValue): void

  /**
   * Send a custom Signal to the global Stage. Before use, select the corresponding Signal name to ensure correct
   * parameter usage
   *
   * 发送信号: 向关卡全局发送一个自定义信号，使用前需要先选择对应的信号名，然后才能正确的使用该信号的参数
   *
   * GSTS Note: You still need to register the signal in the signal manager in the editor; Using signal distribution can avoid some large loop triggering load limits, which can be used for performance optimization
   *
   * GSTS 注: 你仍然需要在编辑器内的信号管理器注册信号; 使用信号分发能够避免一些大循环触发负载限制, 可用于性能优化
   *
   * @param signalName Only literal string is supported
   *
   * 信号名（仅支持字面量字符串）
   */
  function send(signalName: StrValue): void

  /**
   * Returns the Player Entity based on Player ID, where the ID indicates which Player they are
   *
   * 根据玩家序号获取玩家实体: 根据玩家序号获取玩家实体，玩家序号即该玩家为玩家几
   *
   * GSTS Note: The ID starts from 1
   *
   * GSTS 注: 从1开始
   *
   * @param playerId
   *
   * 玩家序号
   *
   * @returns
   *
   * 玩家实体
   */
  function player(playerId: IntValue): PlayerEntity

  /**
   * The Stage Entity
   *
   * 关卡实体
   */
  const stage: StageEntity

  /**
   * The Stage Entity
   *
   * 关卡实体
   */
  const level: StageEntity

  /**
   * Returns the Entity associated with this Node Graph
   *
   * 获取自身实体: 返回该节点图所关联的实体
   *
   * @returns
   *
   * 自身实体
   */
  const self: entity

  /**
   * Unity-style Math helpers (server-only)
   *
   * Unity 风格数学工具（仅 server）
   */
  const Mathf: {
    /**
     * Absolute value
     *
     * 绝对值
     */
    Abs(value: FloatValue | IntValue): number | bigint
    /**
     * Floor to integer
     *
     * 向下取整
     */
    FloorToInt(value: FloatValue | IntValue): bigint
    /**
     * Ceil to integer
     *
     * 向上取整
     */
    CeilToInt(value: FloatValue | IntValue): bigint
    /**
     * Round to nearest integer
     *
     * 四舍五入
     */
    RoundToInt(value: FloatValue | IntValue): bigint
    /**
     * Square root
     *
     * 开平方
     */
    Sqrt(value: FloatValue | IntValue): number
    /**
     * Power
     *
     * 次方
     */
    Pow(base: FloatValue | IntValue, exponent: FloatValue | IntValue): number | bigint
    /**
     * Logarithm (base e when base omitted)
     *
     * 对数（base 省略时使用 e）
     */
    Log(value: FloatValue | IntValue, base?: FloatValue | IntValue): number
    /**
     * Sine (radian)
     *
     * 正弦（弧度）
     */
    Sin(radian: FloatValue | IntValue): number
    /**
     * Cosine (radian)
     *
     * 余弦（弧度）
     */
    Cos(radian: FloatValue | IntValue): number
    /**
     * Tangent (radian)
     *
     * 正切（弧度）
     */
    Tan(radian: FloatValue | IntValue): number
  }

  /**
   * Unity-style random helpers (server-only)
   *
   * Unity 风格随机工具（仅 server）
   */
  const Random: {
    /**
     * Random in range (inclusive)
     *
     * 范围随机（闭区间）
     */
    Range(min: FloatValue, max: FloatValue): number
    Range(min: IntValue, max: IntValue): bigint
    /**
     * Random value in [0, 1] (inclusive)
     *
     * 0~1 随机值（闭区间）
     */
    readonly value: number
  }

  /**
   * Unity-style Vector3 helpers (server-only)
   *
   * Unity 风格 Vector3 工具（仅 server）
   */
  const Vector3: {
    /** Zero vector / 零向量 */
    readonly zero: vec3
    /** One vector / 全 1 向量 */
    readonly one: vec3
    /** Up / 上方向 */
    readonly up: vec3
    /** Down / 下方向 */
    readonly down: vec3
    /** Left / 左方向 */
    readonly left: vec3
    /** Right / 右方向 */
    readonly right: vec3
    /** Forward / 前方向 */
    readonly forward: vec3
    /** Back / 后方向 */
    readonly back: vec3
    /** Dot product / 点乘 */
    Dot(a: Vec3Value, b: Vec3Value): number
    /** Cross product / 叉乘 */
    Cross(a: Vec3Value, b: Vec3Value): vec3
    /** Distance / 距离 */
    Distance(a: Vec3Value, b: Vec3Value): number
    /** Angle / 夹角 */
    Angle(a: Vec3Value, b: Vec3Value): number
    /** Normalize / 归一化 */
    Normalize(v: Vec3Value): vec3
    /** Magnitude / 模长 */
    Magnitude(v: Vec3Value): number
    /** Add / 相加 */
    Add(a: Vec3Value, b: Vec3Value): vec3
    /** Sub / 相减 */
    Sub(a: Vec3Value, b: Vec3Value): vec3
    /** Scale / 缩放 */
    Scale(v: Vec3Value, s: FloatValue | IntValue): vec3
    /** Rotation / 旋转 */
    Rotation(rotate: Vec3Value, v: Vec3Value): vec3
    /** Lerp / 线性插值 */
    Lerp(a: Vec3Value, b: Vec3Value, t: FloatValue | IntValue): vec3
    /** Clamp magnitude / 限制模长 */
    ClampMagnitude(v: Vec3Value, max: FloatValue | IntValue): vec3
  }

  /**
   * Unity-style GameObject helpers (server-only)
   *
   * Unity 风格 GameObject 工具（仅 server）
   */
  const GameObject: {
    /**
     * Find by guid
     *
     * 通过 guid 查询实体
     */
    Find(guidValue: GuidValue): entity
    /**
     * Find first by tag index
     *
     * 通过标签索引查询首个实体
     */
    FindWithTag(tag: IntValue): entity
    /**
     * Find all by tag index
     *
     * 通过标签索引查询实体列表
     */
    FindGameObjectsWithTag(tag: IntValue): entity[]
    /**
     * Find by prefab id (returns list)
     *
     * 通过 prefabId 查询实体列表
     */
    FindByPrefabId(prefab: PrefabIdValue): entity[]
  }

  /**
   * Combines up to 50 Key-Value Pairs into one Dictionary
   *
   * 拼装字典: 将至多50个键值对拼合为一个字典
   *
   * GSTS Note: The dictionary declared by this method cannot be modified, and a node graph variable dictionary must be declared if modification is required.
   *
   * GSTS 注: 该方法声明的字典无法进行修改, 需要修改时必须声明节点图变量字典
   */
  function dict(obj: Record<string, FloatValue>): ReadonlyDict<'str', 'float'>
  function dict(obj: Record<string, IntValue>): ReadonlyDict<'str', 'int'>
  function dict(obj: Record<string, BoolValue>): ReadonlyDict<'str', 'bool'>
  function dict(obj: Record<string, ConfigIdValue>): ReadonlyDict<'str', 'config_id'>
  function dict(obj: Record<string, EntityValue>): ReadonlyDict<'str', 'entity'>
  function dict(obj: Record<string, FactionValue>): ReadonlyDict<'str', 'faction'>
  function dict(obj: Record<string, GuidValue>): ReadonlyDict<'str', 'guid'>
  function dict(obj: Record<string, PrefabIdValue>): ReadonlyDict<'str', 'prefab_id'>
  function dict(obj: Record<string, StrValue>): ReadonlyDict<'str', 'str'>
  function dict(obj: Record<string, vec3>): ReadonlyDict<'str', 'vec3'>
  function dict(obj: Record<string, FloatValue[]>): ReadonlyDict<'str', 'float_list'>
  function dict(obj: Record<string, IntValue[]>): ReadonlyDict<'str', 'int_list'>
  function dict(obj: Record<string, BoolValue[]>): ReadonlyDict<'str', 'bool_list'>
  function dict(obj: Record<string, ConfigIdValue[]>): ReadonlyDict<'str', 'config_id_list'>
  function dict(obj: Record<string, EntityValue[]>): ReadonlyDict<'str', 'entity_list'>
  function dict(obj: Record<string, FactionValue[]>): ReadonlyDict<'str', 'faction_list'>
  function dict(obj: Record<string, GuidValue[]>): ReadonlyDict<'str', 'guid_list'>
  function dict(obj: Record<string, PrefabIdValue[]>): ReadonlyDict<'str', 'prefab_id_list'>
  function dict(obj: Record<string, StrValue[]>): ReadonlyDict<'str', 'str_list'>
  function dict(obj: Record<string, Vec3Value[]>): ReadonlyDict<'str', 'vec3_list'>
  function dict<V extends DictValueType>(
    obj: Record<string, RuntimeParameterValueTypeMap[V]>
  ): ReadonlyDict<'str', V>

  function dict(pairs: { k: IntValue; v: FloatValue }[]): ReadonlyDict<'int', 'float'>
  function dict(pairs: { k: IntValue; v: IntValue }[]): ReadonlyDict<'int', 'int'>
  function dict(pairs: { k: IntValue; v: BoolValue }[]): ReadonlyDict<'int', 'bool'>
  function dict(pairs: { k: IntValue; v: ConfigIdValue }[]): ReadonlyDict<'int', 'config_id'>
  function dict(pairs: { k: IntValue; v: EntityValue }[]): ReadonlyDict<'int', 'entity'>
  function dict(pairs: { k: IntValue; v: FactionValue }[]): ReadonlyDict<'int', 'faction'>
  function dict(pairs: { k: IntValue; v: GuidValue }[]): ReadonlyDict<'int', 'guid'>
  function dict(pairs: { k: IntValue; v: PrefabIdValue }[]): ReadonlyDict<'int', 'prefab_id'>
  function dict(pairs: { k: IntValue; v: StrValue }[]): ReadonlyDict<'int', 'str'>
  function dict(pairs: { k: IntValue; v: vec3 }[]): ReadonlyDict<'int', 'vec3'>
  function dict(pairs: { k: IntValue; v: FloatValue[] }[]): ReadonlyDict<'int', 'float_list'>
  function dict(pairs: { k: IntValue; v: IntValue[] }[]): ReadonlyDict<'int', 'int_list'>
  function dict(pairs: { k: IntValue; v: BoolValue[] }[]): ReadonlyDict<'int', 'bool_list'>
  function dict(pairs: { k: IntValue; v: ConfigIdValue[] }[]): ReadonlyDict<'int', 'config_id_list'>
  function dict(pairs: { k: IntValue; v: EntityValue[] }[]): ReadonlyDict<'int', 'entity_list'>
  function dict(pairs: { k: IntValue; v: FactionValue[] }[]): ReadonlyDict<'int', 'faction_list'>
  function dict(pairs: { k: IntValue; v: GuidValue[] }[]): ReadonlyDict<'int', 'guid_list'>
  function dict(pairs: { k: IntValue; v: PrefabIdValue[] }[]): ReadonlyDict<'int', 'prefab_id_list'>
  function dict(pairs: { k: IntValue; v: StrValue[] }[]): ReadonlyDict<'int', 'str_list'>
  function dict(pairs: { k: IntValue; v: Vec3Value[] }[]): ReadonlyDict<'int', 'vec3_list'>
  function dict(pairs: { k: StrValue; v: FloatValue }[]): ReadonlyDict<'str', 'float'>
  function dict(pairs: { k: StrValue; v: IntValue }[]): ReadonlyDict<'str', 'int'>
  function dict(pairs: { k: StrValue; v: BoolValue }[]): ReadonlyDict<'str', 'bool'>
  function dict(pairs: { k: StrValue; v: ConfigIdValue }[]): ReadonlyDict<'str', 'config_id'>
  function dict(pairs: { k: StrValue; v: EntityValue }[]): ReadonlyDict<'str', 'entity'>
  function dict(pairs: { k: StrValue; v: FactionValue }[]): ReadonlyDict<'str', 'faction'>
  function dict(pairs: { k: StrValue; v: GuidValue }[]): ReadonlyDict<'str', 'guid'>
  function dict(pairs: { k: StrValue; v: PrefabIdValue }[]): ReadonlyDict<'str', 'prefab_id'>
  function dict(pairs: { k: StrValue; v: StrValue }[]): ReadonlyDict<'str', 'str'>
  function dict(pairs: { k: StrValue; v: vec3 }[]): ReadonlyDict<'str', 'vec3'>
  function dict(pairs: { k: StrValue; v: FloatValue[] }[]): ReadonlyDict<'str', 'float_list'>
  function dict(pairs: { k: StrValue; v: IntValue[] }[]): ReadonlyDict<'str', 'int_list'>
  function dict(pairs: { k: StrValue; v: BoolValue[] }[]): ReadonlyDict<'str', 'bool_list'>
  function dict(pairs: { k: StrValue; v: ConfigIdValue[] }[]): ReadonlyDict<'str', 'config_id_list'>
  function dict(pairs: { k: StrValue; v: EntityValue[] }[]): ReadonlyDict<'str', 'entity_list'>
  function dict(pairs: { k: StrValue; v: FactionValue[] }[]): ReadonlyDict<'str', 'faction_list'>
  function dict(pairs: { k: StrValue; v: GuidValue[] }[]): ReadonlyDict<'str', 'guid_list'>
  function dict(pairs: { k: StrValue; v: PrefabIdValue[] }[]): ReadonlyDict<'str', 'prefab_id_list'>
  function dict(pairs: { k: StrValue; v: StrValue[] }[]): ReadonlyDict<'str', 'str_list'>
  function dict(pairs: { k: StrValue; v: Vec3Value[] }[]): ReadonlyDict<'str', 'vec3_list'>
  function dict(pairs: { k: EntityValue; v: FloatValue }[]): ReadonlyDict<'entity', 'float'>
  function dict(pairs: { k: EntityValue; v: IntValue }[]): ReadonlyDict<'entity', 'int'>
  function dict(pairs: { k: EntityValue; v: BoolValue }[]): ReadonlyDict<'entity', 'bool'>
  function dict(pairs: { k: EntityValue; v: ConfigIdValue }[]): ReadonlyDict<'entity', 'config_id'>
  function dict(pairs: { k: EntityValue; v: EntityValue }[]): ReadonlyDict<'entity', 'entity'>
  function dict(pairs: { k: EntityValue; v: FactionValue }[]): ReadonlyDict<'entity', 'faction'>
  function dict(pairs: { k: EntityValue; v: GuidValue }[]): ReadonlyDict<'entity', 'guid'>
  function dict(pairs: { k: EntityValue; v: PrefabIdValue }[]): ReadonlyDict<'entity', 'prefab_id'>
  function dict(pairs: { k: EntityValue; v: StrValue }[]): ReadonlyDict<'entity', 'str'>
  function dict(pairs: { k: EntityValue; v: vec3 }[]): ReadonlyDict<'entity', 'vec3'>
  function dict(pairs: { k: EntityValue; v: FloatValue[] }[]): ReadonlyDict<'entity', 'float_list'>
  function dict(pairs: { k: EntityValue; v: IntValue[] }[]): ReadonlyDict<'entity', 'int_list'>
  function dict(pairs: { k: EntityValue; v: BoolValue[] }[]): ReadonlyDict<'entity', 'bool_list'>
  function dict(
    pairs: { k: EntityValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'entity', 'config_id_list'>
  function dict(
    pairs: { k: EntityValue; v: EntityValue[] }[]
  ): ReadonlyDict<'entity', 'entity_list'>
  function dict(
    pairs: { k: EntityValue; v: FactionValue[] }[]
  ): ReadonlyDict<'entity', 'faction_list'>
  function dict(pairs: { k: EntityValue; v: GuidValue[] }[]): ReadonlyDict<'entity', 'guid_list'>
  function dict(
    pairs: { k: EntityValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'entity', 'prefab_id_list'>
  function dict(pairs: { k: EntityValue; v: StrValue[] }[]): ReadonlyDict<'entity', 'str_list'>
  function dict(pairs: { k: EntityValue; v: Vec3Value[] }[]): ReadonlyDict<'entity', 'vec3_list'>
  function dict(pairs: { k: GuidValue; v: FloatValue }[]): ReadonlyDict<'guid', 'float'>
  function dict(pairs: { k: GuidValue; v: IntValue }[]): ReadonlyDict<'guid', 'int'>
  function dict(pairs: { k: GuidValue; v: BoolValue }[]): ReadonlyDict<'guid', 'bool'>
  function dict(pairs: { k: GuidValue; v: ConfigIdValue }[]): ReadonlyDict<'guid', 'config_id'>
  function dict(pairs: { k: GuidValue; v: EntityValue }[]): ReadonlyDict<'guid', 'entity'>
  function dict(pairs: { k: GuidValue; v: FactionValue }[]): ReadonlyDict<'guid', 'faction'>
  function dict(pairs: { k: GuidValue; v: GuidValue }[]): ReadonlyDict<'guid', 'guid'>
  function dict(pairs: { k: GuidValue; v: PrefabIdValue }[]): ReadonlyDict<'guid', 'prefab_id'>
  function dict(pairs: { k: GuidValue; v: StrValue }[]): ReadonlyDict<'guid', 'str'>
  function dict(pairs: { k: GuidValue; v: vec3 }[]): ReadonlyDict<'guid', 'vec3'>
  function dict(pairs: { k: GuidValue; v: FloatValue[] }[]): ReadonlyDict<'guid', 'float_list'>
  function dict(pairs: { k: GuidValue; v: IntValue[] }[]): ReadonlyDict<'guid', 'int_list'>
  function dict(pairs: { k: GuidValue; v: BoolValue[] }[]): ReadonlyDict<'guid', 'bool_list'>
  function dict(
    pairs: { k: GuidValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'guid', 'config_id_list'>
  function dict(pairs: { k: GuidValue; v: EntityValue[] }[]): ReadonlyDict<'guid', 'entity_list'>
  function dict(pairs: { k: GuidValue; v: FactionValue[] }[]): ReadonlyDict<'guid', 'faction_list'>
  function dict(pairs: { k: GuidValue; v: GuidValue[] }[]): ReadonlyDict<'guid', 'guid_list'>
  function dict(
    pairs: { k: GuidValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'guid', 'prefab_id_list'>
  function dict(pairs: { k: GuidValue; v: StrValue[] }[]): ReadonlyDict<'guid', 'str_list'>
  function dict(pairs: { k: GuidValue; v: Vec3Value[] }[]): ReadonlyDict<'guid', 'vec3_list'>
  function dict(pairs: { k: FactionValue; v: FloatValue }[]): ReadonlyDict<'faction', 'float'>
  function dict(pairs: { k: FactionValue; v: IntValue }[]): ReadonlyDict<'faction', 'int'>
  function dict(pairs: { k: FactionValue; v: BoolValue }[]): ReadonlyDict<'faction', 'bool'>
  function dict(
    pairs: { k: FactionValue; v: ConfigIdValue }[]
  ): ReadonlyDict<'faction', 'config_id'>
  function dict(pairs: { k: FactionValue; v: EntityValue }[]): ReadonlyDict<'faction', 'entity'>
  function dict(pairs: { k: FactionValue; v: FactionValue }[]): ReadonlyDict<'faction', 'faction'>
  function dict(pairs: { k: FactionValue; v: GuidValue }[]): ReadonlyDict<'faction', 'guid'>
  function dict(
    pairs: { k: FactionValue; v: PrefabIdValue }[]
  ): ReadonlyDict<'faction', 'prefab_id'>
  function dict(pairs: { k: FactionValue; v: StrValue }[]): ReadonlyDict<'faction', 'str'>
  function dict(pairs: { k: FactionValue; v: vec3 }[]): ReadonlyDict<'faction', 'vec3'>
  function dict(
    pairs: { k: FactionValue; v: FloatValue[] }[]
  ): ReadonlyDict<'faction', 'float_list'>
  function dict(pairs: { k: FactionValue; v: IntValue[] }[]): ReadonlyDict<'faction', 'int_list'>
  function dict(pairs: { k: FactionValue; v: BoolValue[] }[]): ReadonlyDict<'faction', 'bool_list'>
  function dict(
    pairs: { k: FactionValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'faction', 'config_id_list'>
  function dict(
    pairs: { k: FactionValue; v: EntityValue[] }[]
  ): ReadonlyDict<'faction', 'entity_list'>
  function dict(
    pairs: { k: FactionValue; v: FactionValue[] }[]
  ): ReadonlyDict<'faction', 'faction_list'>
  function dict(pairs: { k: FactionValue; v: GuidValue[] }[]): ReadonlyDict<'faction', 'guid_list'>
  function dict(
    pairs: { k: FactionValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'faction', 'prefab_id_list'>
  function dict(pairs: { k: FactionValue; v: StrValue[] }[]): ReadonlyDict<'faction', 'str_list'>
  function dict(pairs: { k: FactionValue; v: Vec3Value[] }[]): ReadonlyDict<'faction', 'vec3_list'>
  function dict(pairs: { k: ConfigIdValue; v: FloatValue }[]): ReadonlyDict<'config_id', 'float'>
  function dict(pairs: { k: ConfigIdValue; v: IntValue }[]): ReadonlyDict<'config_id', 'int'>
  function dict(pairs: { k: ConfigIdValue; v: BoolValue }[]): ReadonlyDict<'config_id', 'bool'>
  function dict(
    pairs: { k: ConfigIdValue; v: ConfigIdValue }[]
  ): ReadonlyDict<'config_id', 'config_id'>
  function dict(pairs: { k: ConfigIdValue; v: EntityValue }[]): ReadonlyDict<'config_id', 'entity'>
  function dict(
    pairs: { k: ConfigIdValue; v: FactionValue }[]
  ): ReadonlyDict<'config_id', 'faction'>
  function dict(pairs: { k: ConfigIdValue; v: GuidValue }[]): ReadonlyDict<'config_id', 'guid'>
  function dict(
    pairs: { k: ConfigIdValue; v: PrefabIdValue }[]
  ): ReadonlyDict<'config_id', 'prefab_id'>
  function dict(pairs: { k: ConfigIdValue; v: StrValue }[]): ReadonlyDict<'config_id', 'str'>
  function dict(pairs: { k: ConfigIdValue; v: vec3 }[]): ReadonlyDict<'config_id', 'vec3'>
  function dict(
    pairs: { k: ConfigIdValue; v: FloatValue[] }[]
  ): ReadonlyDict<'config_id', 'float_list'>
  function dict(pairs: { k: ConfigIdValue; v: IntValue[] }[]): ReadonlyDict<'config_id', 'int_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: BoolValue[] }[]
  ): ReadonlyDict<'config_id', 'bool_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'config_id', 'config_id_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: EntityValue[] }[]
  ): ReadonlyDict<'config_id', 'entity_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: FactionValue[] }[]
  ): ReadonlyDict<'config_id', 'faction_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: GuidValue[] }[]
  ): ReadonlyDict<'config_id', 'guid_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'config_id', 'prefab_id_list'>
  function dict(pairs: { k: ConfigIdValue; v: StrValue[] }[]): ReadonlyDict<'config_id', 'str_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: Vec3Value[] }[]
  ): ReadonlyDict<'config_id', 'vec3_list'>
  function dict(pairs: { k: PrefabIdValue; v: FloatValue }[]): ReadonlyDict<'prefab_id', 'float'>
  function dict(pairs: { k: PrefabIdValue; v: IntValue }[]): ReadonlyDict<'prefab_id', 'int'>
  function dict(pairs: { k: PrefabIdValue; v: BoolValue }[]): ReadonlyDict<'prefab_id', 'bool'>
  function dict(
    pairs: { k: PrefabIdValue; v: ConfigIdValue }[]
  ): ReadonlyDict<'prefab_id', 'config_id'>
  function dict(pairs: { k: PrefabIdValue; v: EntityValue }[]): ReadonlyDict<'prefab_id', 'entity'>
  function dict(
    pairs: { k: PrefabIdValue; v: FactionValue }[]
  ): ReadonlyDict<'prefab_id', 'faction'>
  function dict(pairs: { k: PrefabIdValue; v: GuidValue }[]): ReadonlyDict<'prefab_id', 'guid'>
  function dict(
    pairs: { k: PrefabIdValue; v: PrefabIdValue }[]
  ): ReadonlyDict<'prefab_id', 'prefab_id'>
  function dict(pairs: { k: PrefabIdValue; v: StrValue }[]): ReadonlyDict<'prefab_id', 'str'>
  function dict(pairs: { k: PrefabIdValue; v: vec3 }[]): ReadonlyDict<'prefab_id', 'vec3'>
  function dict(
    pairs: { k: PrefabIdValue; v: FloatValue[] }[]
  ): ReadonlyDict<'prefab_id', 'float_list'>
  function dict(pairs: { k: PrefabIdValue; v: IntValue[] }[]): ReadonlyDict<'prefab_id', 'int_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: BoolValue[] }[]
  ): ReadonlyDict<'prefab_id', 'bool_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'prefab_id', 'config_id_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: EntityValue[] }[]
  ): ReadonlyDict<'prefab_id', 'entity_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: FactionValue[] }[]
  ): ReadonlyDict<'prefab_id', 'faction_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: GuidValue[] }[]
  ): ReadonlyDict<'prefab_id', 'guid_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'prefab_id', 'prefab_id_list'>
  function dict(pairs: { k: PrefabIdValue; v: StrValue[] }[]): ReadonlyDict<'prefab_id', 'str_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: Vec3Value[] }[]
  ): ReadonlyDict<'prefab_id', 'vec3_list'>
  function dict<K extends DictKeyType, V extends DictValueType>(
    pairs: { k: RuntimeParameterValueTypeMap[K]; v: RuntimeParameterValueTypeMap[V] }[]
  ): ReadonlyDict<K, V>
  function list<
    T extends
      | 'bool'
      | 'config_id'
      | 'entity'
      | 'faction'
      | 'float'
      | 'guid'
      | 'int'
      | 'prefab_id'
      | 'str'
      | 'vec3'
  >(type: T, items?: RuntimeParameterValueTypeMap[T][]): RuntimeReturnValueTypeMap[`${T}_list`]

  /**
   * JS-like setTimeout for node graph timers, if not in node graph scope, use JS native setTimeout.
   *
   * 节点图定时器版本的 setTimeout（JS 风格）, 在节点图作用域外则仍用JS原生setTimeout
   *
   * GSTS Note: The internal tick of node graph system is unstable, the delay cannot be guaranteed precisely, please test the effect yourself, the delay has been passed to the node graph timer as it is.
   *
   * GSTS注: 节点图系统内部tick不稳定, 延时无法保证精确, 务必自行测试效果, 此处延时已如实传递给节点图定时器
   */
  function setTimeout(
    handler: (
      evt: ServerEventPayloads['whenTimerIsTriggered'],
      f: ServerExecutionFlowFunctions
    ) => void,
    delayMs?: FloatValue
  ): string
  /**
   * JS-like setInterval for node graph timers, if not in node graph scope, use JS native setInterval.
   *
   * 节点图定时器版本的 setInterval（JS 风格）, 在节点图作用域外则仍用JS原生setInterval
   *
   * GSTS Note: The internal tick of node graph system is unstable, the delay cannot be guaranteed precisely, please test the effect yourself, the delay has been passed to the node graph timer as it is.
   *
   * GSTS注: 节点图系统内部tick不稳定, 延时无法保证精确, 务必自行测试效果, 此处延时已如实传递给节点图定时器
   */
  function setInterval(
    handler: (
      evt: ServerEventPayloads['whenTimerIsTriggered'],
      f: ServerExecutionFlowFunctions
    ) => void,
    delayMs?: FloatValue
  ): string
  /**
   * Clear a timer created by setTimeout.
   *
   * 清理 setTimeout 创建的定时器。
   */
  function clearTimeout(timerName: StrValue): void
  /**
   * Clear a timer created by setInterval.
   *
   * 清理 setInterval 创建的定时器。
   */
  function clearInterval(timerName: StrValue): void

  /**
   * Math functions are compiled to node graph equivalents in server scope.
   *
   * server 作用域内的 Math 会编译为节点图等价实现。
   */
  interface Math {
    /** Absolute value / 绝对值 */
    abs(x: number): number
    /** Round down / 向下取整 */
    floor(x: number): number
    /** Round up / 向上取整 */
    ceil(x: number): number
    /** Round to nearest / 四舍五入 */
    round(x: number): number
    /** Truncate / 截尾取整 */
    trunc(x: number): number
    /** Power / 次方 */
    pow(x: number, y: number): number
    /** Square root / 开平方 */
    sqrt(x: number): number
    /** Natural log / 自然对数 */
    log(x: number): number
    /** Base-10 log / 常用对数 */
    log10(x: number): number
    /** Base-2 log / 以 2 为底 */
    log2(x: number): number
    /** Sine (radian) / 正弦（弧度） */
    sin(x: number): number
    /** Cosine (radian) / 余弦（弧度） */
    cos(x: number): number
    /** Tangent (radian) / 正切（弧度） */
    tan(x: number): number
    /** Arc-sine / 反正弦 */
    asin(x: number): number
    /** Arc-cosine / 反余弦 */
    acos(x: number): number
    /** Arc-tangent / 反正切 */
    atan(x: number): number
    /** Arc-tangent with two args / 反正切（双参） */
    atan2(y: number, x: number): number
    /** Hypotenuse / 斜边长度 */
    hypot(x: number, y: number, z?: number): number
    /** Cube root / 立方根 */
    cbrt(x: number): number
    /** Minimum / 最小值 */
    min(...values: number[]): number
    /** Maximum / 最大值 */
    max(...values: number[]): number
    /** Sign / 符号 */
    sign(x: number): number
    /**
     * Random in [0, 1] (inclusive in GSTS)
     *
     * 随机数（GSTS 为闭区间）
     */
    random(): number
  }
}

export {}
