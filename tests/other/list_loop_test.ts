import { buildServerGraphRegistriesIRDocuments, g } from 'genshin-ts/runtime/core'

g.server().on('whenEntityIsCreated', (_evt, f) => {
  const list = f.assemblyList([1, 2, 3])

  f.listIterationLoop(list, (v, breakLoop) => {
    f.printString('in list loop')
    // v 是 iterationValue 的数据 pin
    void v
    breakLoop()
  })

  f.printString('after list loop')
})






