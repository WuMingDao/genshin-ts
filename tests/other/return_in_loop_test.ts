import { buildServerGraphRegistriesIRDocuments, g } from 'genshin-ts/runtime/core'

g.server().on('whenEntityIsCreated', (_evt, f) => {
  f.printString('before loop')

  f.finiteLoop(0, 2, (_i, _breakLoop) => {
    // 模拟：循环内条件 return
    f.doubleBranch(
      true,
      () => {
        f.printString('keep going')
      },
      () => {
        f.return()
      }
    )
  })

  f.printString('after loop')
})













