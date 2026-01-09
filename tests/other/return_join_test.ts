import { buildServerGraphRegistriesIRDocuments, g } from 'genshin-ts/runtime/core'

g.server().on('whenEntityIsCreated', (_evt, f) => {
  f.printString('before')

  // 有 return：after 应只从未 return 的分支尾部连入（join 语义生效）
  f.doubleBranch(
    true,
    () => {
      f.printString('true path')
    },
    () => {
      f.printString('false path')
      f.return()
      f.printString('unreachable')
    }
  )
  f.printString('after')

  // 无 return：after2 仍接在分支前节点（旧语义）
  f.doubleBranch(
    true,
    () => {
      f.printString('t2')
    },
    () => {
      f.printString('f2')
    }
  )
  f.printString('after2')
})


