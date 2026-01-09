import * as semver from 'semver'
import YAML from 'yaml'

export type NoticeFrontmatter = {
  /**
   * semver range (e.g. ">=0.1.0 <0.2.0")
   */
  versions?: string | string[]
  /**
   * show before this time (ISO string or timestamp)
   */
  showBefore?: string | number
}

export function splitMarkdownFrontmatter(md: string): {
  meta: NoticeFrontmatter | null
  body: string
} {
  const text = md.replace(/^\uFEFF/, '')
  if (!text.startsWith('---\n')) return { meta: null, body: md }
  const end = text.indexOf('\n---', 4)
  if (end === -1) return { meta: null, body: md }
  const after = text.indexOf('\n', end + 4)
  const header = text.slice(4, end).trim()
  const body = after === -1 ? '' : text.slice(after + 1)
  try {
    const meta = (YAML.parse(header) ?? null) as NoticeFrontmatter | null
    return { meta, body }
  } catch {
    return { meta: null, body: md }
  }
}

function toMs(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim().length) {
    const t = Date.parse(v)
    if (Number.isFinite(t)) return t
  }
  return null
}

export function shouldShowNotice(
  meta: NoticeFrontmatter | null,
  nowMs: number,
  version: string | null
) {
  if (!meta) return true
  const until = toMs(meta.showBefore)
  if (until !== null && nowMs > until) return false

  const ranges = meta.versions
  if (!ranges) return true
  if (!version) return true

  const list = Array.isArray(ranges) ? ranges : [ranges]
  const cleaned = list.map((s) => String(s).trim()).filter(Boolean)
  if (!cleaned.length) return true
  return cleaned.some((r) => semver.satisfies(version, r, { includePrerelease: true }))
}
