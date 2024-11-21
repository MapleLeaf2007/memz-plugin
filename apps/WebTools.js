import { Config } from '../components/index.js'

export async function fetchSeoFromHtml (url) {
  const response = await fetch(url)
  const html = await response.text()

  // 使用正则表达式提取 title、description、keywords
  const titleMatch = html.match(/<title>(.*?)<\/title>/i)
  const descriptionMatch = html.match(
    /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i
  )
  const keywordsMatch = html.match(
    /<meta\s+name=["']keywords["']\s+content=["'](.*?)["']/i
  )

  return {
    title: titleMatch ? titleMatch[1] : '未找到标题',
    description: descriptionMatch ? descriptionMatch[1] : '未找到描述',
    keywords: keywordsMatch ? keywordsMatch[1] : '未找到关键词'
  }
}

export function encodeToUrl (msg) {
  return encodeURIComponent(msg)
}

export function decodeFromUrl (urlStr) {
  return decodeURIComponent(urlStr)
}
export function encodeToUnicode (msg) {
  return msg
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0).toString(16).padStart(4, '0')
      return `\\u${code}`
    })
    .join('')
}

export function decodeFromUnicode (unicodeStr) {
  return unicodeStr.replace(/\\u[\dA-Fa-f]{4}/g, (match) =>
    String.fromCharCode(parseInt(match.replace('\\u', ''), 16))
  )
}

export function encodeToAscii (msg) {
  return msg
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)
      return `\\x${code.toString(16).padStart(2, '0')}`
    })
    .join('')
}

export function decodeFromAscii (asciiStr) {
  return asciiStr.replace(/\\x[\dA-Fa-f]{2}/g, (match) =>
    String.fromCharCode(parseInt(match.replace('\\x', ''), 16))
  )
}
export class WebTools extends plugin {
  constructor () {
    super({
      name: 'seo',
      dsc: '抓取网站SEO信息',
      event: 'message',
      priority: 6,
      rule: [
        {
          reg: '^#?seo\\s*(.+)',
          fnc: 'fetchSeoInfoHandler'
        },
        {
          reg: /^(#?)(url)(编码|解码)\s*(.+)/,
          fnc: 'handleUrlEncodingDecoding'
        },
        {
          reg: /^(#?)(unicode|ascii)(编码|解码)\s*(.+)/,
          fnc: 'handleEncodingDecoding'
        }
      ]
    })
  }

  async fetchSeoInfoHandler (e) {
    const { SeoAll } = Config.getConfig('memz')
    if (!SeoAll && !e.isMaster) { return logger.warn('[memz-plugin]Seo状态当前为仅主人可用') }
    let url = e.msg.match(/^#?seo\s*(.+)/)[1].trim()
    if (!url.startsWith('http')) {
      url = `https://${url}`
    }

    try {
      const seoInfo = await fetchSeoFromHtml(url)
      const result = `SEO信息:\n页面标题: ${seoInfo.title}\n描述: ${seoInfo.description}\n关键词: ${seoInfo.keywords}`
      await e.reply(result, true)
    } catch (error) {
      await e.reply(`抓取失败: ${error.message}`, true)
    }
  }

  async handleReply (e, handler) {
    const msg = e.msg.match(handler.reg)
    const operation = msg[2]
    const action = msg[3]
    const input = msg[4].trim()

    let result
    try {
      if (operation === 'url') {
        result = action === '编码' ? encodeToUrl(input) : decodeFromUrl(input)
      }

      await e.reply(`结果: ${result}`, true)
    } catch (error) {
      await e.reply(`Error: ${error.message}`)
    }
  }

  async handleUrlEncodingDecoding (e) {
    const { UrlAll } = Config.getConfig('memz')
    if (!UrlAll && !e.isMaster) { return logger.warn('[memz-plugin]URL状态当前为仅主人可用') }
    await this.handleReply(e, {
      reg: /^(#?)(url)(编码|解码)\s*(.+)/,
      fn: this.handleReply
    })
  }

  async unicodehandleReply (e, handler) {
    const msg = e.msg.match(handler.reg)
    const operation = msg[2]
    const action = msg[3]
    const input = msg[4].trim()

    let result
    try {
      if (operation === 'unicode') {
        result =
          action === '编码' ? encodeToUnicode(input) : decodeFromUnicode(input)
      } else if (operation === 'ascii') {
        result =
          action === '编码' ? encodeToAscii(input) : decodeFromAscii(input)
      }

      await e.reply(`结果:${result}`, true)
    } catch (error) {
      await e.reply(`Error: ${error.message}`)
    }
  }

  async handleEncodingDecoding (e) {
    const { UnicodeAll } = Config.getConfig('memz')
    if (!UnicodeAll && !e.isMaster) { return logger.warn('[memz-plugin]Unicode功能当前为仅主人可用') }
    await this.unicodehandleReply(e, {
      reg: /^(#?)(unicode|ascii)(编码|解码)\s*(.+)/,
      fn: this.unicodehandleReply
    })
  }
}
