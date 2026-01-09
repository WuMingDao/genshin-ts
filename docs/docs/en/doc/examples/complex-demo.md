# Comprehensive Demo

Below is a predictable example that covers many syntax features and can be verified in the editor.

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

Expected output (order may vary by timing):
- `mode:high` or `mode:low`
- `demo`
- `9`
- `2`
- `2`
- `timeout:outer`
- `9`
- `timeout:inner`

Notes:
- `let` forces local variables, avoiding const wiring optimization.
- `list('int', [...])` makes list types explicit.
- `setTimeout` supports nested callbacks and by-value captures.
