import type { LangOption } from './options.js'

export function formatMessage(lang: LangOption, zh: string, en: string): string {
  if (lang === 'zh') return zh
  if (lang === 'en') return en
  return `ZH: ${zh}\n\nEN: ${en}`
}
