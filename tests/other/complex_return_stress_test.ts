import fs from 'node:fs'

import { buildServerGraphRegistriesIRDocuments, g } from 'genshin-ts/runtime/core'

/**
 * 超复杂压力测试：分支里套循环、循环里套分支/多分支、混合多个 return
 *
 * 关注点：
 * - return 是否写入 _gsts_return_<id> 并触发 breakLoop（嵌套循环逐层 break）
 * - loop complete 是否出现 gate（get_node_graph_variable + double_branch）并在 false 分支重置为 false
 * - 没有 return 的结构仍保持“后续接分支前节点”的清晰语义
 */
g.server().on('whenEntityIsCreated', (_evt, f) => {
  f.printString('start')

  // 外层循环 A
  f.finiteLoop(0, 1, (_a, _breakA) => {
    f.printString('A body')

    // 分支内再套循环 B（常见：if里再循环）
    f.doubleBranch(
      true,
      () => {
        f.printString('A.true -> enter B loop')
        f.finiteLoop(0, 2, (_b, _breakB) => {
          f.printString('B body')

          // B 中多分支，某个 case return
          f.multipleBranches(1, {
            default: () => {
              f.printString('B.mb default')
            },
            1: () => {
              f.printString('B.mb case1 -> return')
              f.return()
              f.printString('B.mb unreachable')
            }
          })

          // B 中 list loop（分支里再套 list loop）
          const l1 = f.assemblyList([1, 2, 3], 'int')
          f.listIterationLoop(l1, (_v1, _breakL1) => {
            f.printString('L1 body')
            // list loop 内 if return
            f.doubleBranch(
              true,
              () => {
                f.printString('L1.true')
              },
              () => {
                f.printString('L1.false -> return')
                f.return()
              }
            )
            f.printString('L1 tail')
          })

          f.printString('B tail')
        })

        f.printString('A.true tail')
      },
      () => {
        // A.false 分支本身也能 return（但这里给个更复杂结构：先套多分支，再套循环）
        f.printString('A.false -> maybe return')
        f.multipleBranches(2, {
          default: () => {
            f.printString('A.false default -> continue')
          },
          2: () => {
            f.printString('A.false case2 -> enter C loop then return')
            f.finiteLoop(0, 3, (_c, _breakC) => {
              f.printString('C body')
              f.doubleBranch(
                true,
                () => {
                  f.printString('C.true -> return')
                  f.return()
                },
                () => {
                  f.printString('C.false')
                }
              )
              f.printString('C tail')
            })
          }
        })
        f.printString('A.false tail')
      }
    )

    // A 循环体末尾：如果上面任一路径 runtime return 成立，应被 gate 拦住
    f.printString('A end')
  })

  // 循环之后：如果上面 return 发生，应被 loop-complete gate 拦住
  f.printString('after all')
})

// const out = buildServerGraphRegistriesIRDocuments()
// fs.writeFileSync('./examples/complex_return_stress_test.json', JSON.stringify(out, null, 2))
// console.log('[ok] wrote ./examples/complex_return_stress_test.json')
