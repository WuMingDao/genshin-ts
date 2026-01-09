import { g } from 'genshin-ts/runtime/core'

/* global raw */

g.server().on('whenTimerIsTriggered', () => {
  // raw(): 参数表达式不做任何编译处理，保持原样
  const a = raw(1 + 2 * 3)

  // 其它 wrapper：仍做正常编译（但 list 的 items 数组不再被包 assemblyList）
  const n = int(123)
  const b = bool(n == int(0))
  const d = dict({ x: n, y: int(2) })
  const g = gsts.f.assemblyList([1n, 2n, 3n])
  const e = list('int', [n + int(2), ...g, int(3)])
  const e2 = list('int', [n + int(2), int(3)])
  void [n, 234, int(5)]
})
