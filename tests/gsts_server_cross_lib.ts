const CROSS_TAG = 'gstsServer_cross'
let crossSeed = 3n

export function gstsServerCrossAdd(a: bigint, b: bigint) {
  crossSeed = crossSeed + 1n
  const sum = a + b + crossSeed
  setTimeout(() => {
    gsts.f.printString(CROSS_TAG)
    gsts.f.printString(str(sum))
  }, 100)
  return sum
}
