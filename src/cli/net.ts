import { clearTimeout, setTimeout } from 'node:timers'

import { fetch, ProxyAgent } from 'undici'

function pickProxy(url: string): string | undefined {
  const isHttps = url.toLowerCase().startsWith('https:')
  const httpsProxy = process.env.HTTPS_PROXY ?? process.env.https_proxy
  const httpProxy = process.env.HTTP_PROXY ?? process.env.http_proxy
  const allProxy = process.env.ALL_PROXY ?? process.env.all_proxy
  const proxy = isHttps
    ? (httpsProxy ?? allProxy ?? httpProxy)
    : (httpProxy ?? allProxy ?? httpsProxy)
  return proxy || undefined
}

export async function fetchText(url: string, opts?: { timeoutMs?: number }): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 4000)
  try {
    const proxy = pickProxy(url)
    const dispatcher = proxy ? new ProxyAgent(proxy) : undefined
    const res = await fetch(url, {
      dispatcher,
      headers: {
        'user-agent': 'genshin-ts'
      },
      signal: controller.signal
    })
    if (!res.ok) {
      throw new Error(`[error] http ${res.status} ${res.statusText}`)
    }
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}
