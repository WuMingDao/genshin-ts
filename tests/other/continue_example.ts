import { g } from 'genshin-ts/runtime/core'

/**
 * continue behavior check: for / while / do...while / for...of
 * Watch the log order to verify each continue skips the rest of the iteration.
 */
g.server({
  id: 1073741827
}).on('whenEntityIsCreated', (_evt, f) => {
  f.printString('start')

  f.printString('for: enter')
  for (let i = 0; i < 3; i++) {
    f.printString('for: body top')
    if (i === 1) {
      f.printString('for: continue hit')
      continue
    }
    f.printString('for: body tail')
  }
  f.printString('for: exit')

  f.printString('while: enter')
  let j = 0
  while (j < 3) {
    f.printString('while: body top')
    j = j + 1
    if (j === 2) {
      f.printString('while: continue hit')
      continue
    }
    f.printString('while: body tail')
  }
  f.printString('while: exit')

  f.printString('do: enter')
  let k = 0
  do {
    f.printString('do: body top')
    k = k + 1
    if (k === 2) {
      f.printString('do: continue hit')
      continue
    }
    f.printString('do: body tail')
  } while (k < 3)
  f.printString('do: exit')

  const list = f.assemblyList([1, 2, 3], 'int')
  f.printString('for-of: enter')
  for (const _v of list) {
    f.printString('for-of: body top')
    f.printString('for-of: continue hit')
    continue
  }
  f.printString('for-of: exit')

  f.printString('end')
})
