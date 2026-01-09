import { buildServerGraphRegistriesIRDocuments, g } from 'genshin-ts/runtime/core'

g.server().on('whenEntityIsCreated', (_evt, f) => {
  f.printString('before branch')

  f.doubleBranch(
    true,
    () => {
      f.printString('true branch')
    },
    () => {
      f.printString('false branch')
    }
  )

  // 预期：这句应连接到 “before branch” 的节点，而不是 double_branch
  f.printString('after branch')
})






