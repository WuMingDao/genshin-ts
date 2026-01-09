import pc from 'picocolors'

function renderInline(line: string): string {
  // **bold** / __bold__ -> colored bold
  const boldColor = (s: string) => pc.bold(pc.yellow(s))
  return line
    .replace(/\*\*(.+?)\*\*/g, (_m, g1: string) => boldColor(g1))
    .replace(/__(.+?)__/g, (_m, g1: string) => boldColor(g1))
}

export function renderMarkdownToAnsi(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) {
      out.push(pc.bold(pc.cyan(renderInline(line.replace(/^#{1,6}\s+/, '').trim()))))
      continue
    }
    if (/^```/.test(line)) {
      out.push(pc.dim(line))
      continue
    }
    if (/^-\s+/.test(line)) {
      out.push(pc.dim('- ') + renderInline(line.slice(2)))
      continue
    }
    out.push(renderInline(line))
  }
  return out.join('\n').trimEnd()
}
