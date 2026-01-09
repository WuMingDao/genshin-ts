import * as semver from 'semver'

export type UpdateHit = {
  latest: string
  snippet: string
}

function isHeading(line: string): { level: number; text: string } | null {
  const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line)
  if (!m) return null
  return { level: m[1].length, text: m[2] }
}

function coerceVersion(text: string): string | null {
  return semver.coerce(text)?.version ?? null
}

export function findLatestUpdate(md: string, currentVersion: string | null): UpdateHit | null {
  const cur = currentVersion ? semver.clean(currentVersion) : null
  if (!cur) return null

  const lines = md.replace(/\r\n/g, '\n').split('\n')

  // changelog 约定：最新版本永远写在最上面，因此只需要命中第一条版本标题即可
  let best: { idx: number; level: number; ver: string; raw: string } | null = null
  for (let i = 0; i < lines.length; i++) {
    const h = isHeading(lines[i] ?? '')
    if (!h) continue
    const ver = coerceVersion(h.text)
    if (!ver) continue
    best = { idx: i, level: h.level, ver, raw: lines[i] ?? '' }
    break
  }

  if (!best) return null

  if (!semver.gt(best.ver, cur)) return null

  let end = lines.length
  for (let i = best.idx + 1; i < lines.length; i++) {
    const h = isHeading(lines[i] ?? '')
    if (!h) continue
    // 以“下一条版本标题”为分段边界：避免被分段内的小标题/同级标题误切分
    const nextVer = coerceVersion(h.text)
    if (!nextVer) continue
    end = i
    break
  }

  const section = lines.slice(best.idx, end)
  const body = section
    .slice(1)
    .map((s) => s ?? '')
    .filter((s) => s.trim().length)

  const previewBody = body.slice(0, 4)
  const extra = body.length > 4
  const out = [...previewBody]
  if (extra) out.push('...')

  return { latest: best.ver, snippet: out.join('\n') }
}
