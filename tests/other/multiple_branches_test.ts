import { buildServerGraphRegistriesIRDocuments, g } from 'genshin-ts/runtime/core'

g.server().on('whenEntityIsCreated', (_evt, f) => {
  f.printString('before multiple branches')

  f.multipleBranches(2, {
    default: () => {
      f.printString('default branch')
    },
    1: () => {
      f.printString('case 1')
    },
    2: () => {
      f.printString('case 2')
    }
  })

  f.multipleBranches('4', {
    default: () => {},
    gfgf: () => {
      f.printString('case 4')
    }
  })

  // 预期：这句应连接到 “before multiple branches” 的节点，而不是 multiple_branches
  f.printString('after multiple branches')
})






