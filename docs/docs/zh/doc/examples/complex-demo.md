# 综合示例

下面是一个可预测、覆盖多种语法特性的示例，适合在编辑器内验证输出。

```ts
import { g } from 'genshin-ts/runtime/core'

const DEMO_TAG = 'demo'
const BASE = 3n

function gstsServerAdd(a: bigint, b: bigint) {
  return a + b
}

g.server({
  id: 1073741825,
  variables: { counter: 0n }
}).on('whenEntityIsCreated', (_evt, f) => {
  let total = 0n
  const nums = list('int', [1n, 2n, 3n, BASE])

  nums.forEach((n) => {
    total = gstsServerAdd(total, n)
  })

  const evenNums = nums.filter((n) => n % 2n === 0n)
  const second = nums[1]

  let mode = 0n
  if (bool(total > 6n)) {
    mode = 1n
  }

  switch (mode) {
    case 0n:
      f.printString('mode:low')
      break
    default:
      f.printString('mode:high')
      break
  }

  f.printString(DEMO_TAG)
  f.printString(str(total))
  f.printString(str(second))
  f.printString(str(evenNums.length))

  const v = f.get('counter')
  f.set('counter', v + 1n)

  const localSeed = total
  setTimeout(() => {
    f.printString('timeout:outer')
    f.printString(str(localSeed))
    setTimeout(() => {
      f.printString('timeout:inner')
    }, 150)
  }, 200)
})
```

预期输出（顺序略有差异，取决于事件触发时机与定时器延迟）：
- `mode:high` 或 `mode:low`
- `demo`
- `9`
- `2`
- `2`
- `timeout:outer`
- `9`
- `timeout:inner`

说明：
- `let` 用于强制生成局部变量节点（避免 const 被优化连线）。
- `list('int', [...])` 可明确列表类型，空列表也请用该写法。
- `setTimeout` 支持嵌套与闭包捕获（按值）。
