import pc from 'picocolors'

export type Ui = {
  ok: (msg: string, ...rest: unknown[]) => void
  warn: (msg: string, ...rest: unknown[]) => void
  error: (msg: string, ...rest: unknown[]) => void
  info: (msg: string, ...rest: unknown[]) => void
  highlight: (s: string) => string
}

export function createUi(): Ui {
  return {
    ok: (msg, ...rest) => console.log(pc.green('[ok]'), msg, ...rest),
    warn: (msg, ...rest) => console.warn(pc.yellow('[warn]'), msg, ...rest),
    error: (msg, ...rest) => console.error(pc.red('[error]'), msg, ...rest),
    info: (msg, ...rest) => console.log(pc.cyan('[info]'), msg, ...rest),
    highlight: (s) => pc.cyan(s)
  }
}
