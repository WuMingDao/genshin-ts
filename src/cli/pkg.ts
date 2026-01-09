import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type PkgJson = { name?: string; version?: string }

function tryReadPkg(requireFn: ReturnType<typeof createRequire>, spec: string): PkgJson | null {
  try {
    return requireFn(spec) as PkgJson
  } catch {
    return null
  }
}

export function getSelfVersion(): string | null {
  const requireFn = createRequire(import.meta.url)

  // when installed
  const byName = tryReadPkg(requireFn, 'genshin-ts/package.json')
  if (byName?.version) return byName.version

  // when running inside repo / dist
  const here = path.dirname(fileURLToPath(import.meta.url))
  let cur = here
  for (let i = 0; i < 6; i++) {
    const guess = path.join(cur, 'package.json')
    const pkg = tryReadPkg(requireFn, guess)
    if (pkg?.name === 'genshin-ts' && pkg.version) return pkg.version
    cur = path.dirname(cur)
  }
  return null
}
