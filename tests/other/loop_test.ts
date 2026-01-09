import { buildServerGraphRegistriesIRDocuments, g } from 'genshin-ts/runtime/core'

g.server().on('whenEntityIsCreated', (_evt, f) => {
  f.finiteLoop(0, 2, (_i, breakLoop) => {
    f.printString('loop body')
    breakLoop()
    f.printString('unreachable-after-break (still encoded)')
  })

  // 应连接到 Finite Loop 的 Loop Complete 执行输出
  f.printString('after loop')
})






