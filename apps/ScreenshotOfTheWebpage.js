import { Config } from '../components/index.js'
import puppeteer from '../../../lib/puppeteer/puppeteer.js'
export class Webpage extends plugin {
  constructor () {
    super({
      name: '网页截图',
      dsc: '网页截图',
      event: 'message',
      priority: 6,
      rule: [
        {
          reg: '^#?网页截图\\s*(\\S+.*)',
          fnc: 'webpage'
        }
      ]
    })
  }

  async webpage (e) {
    const { webpage } = Config.getConfig('memz')
    if (!webpage && !e.isMaster) {
      return logger.warn('[memz-plugin] 网页截图状态当前为仅主人可用')
    }

    const url = this.extractUrlFromMessage(e.msg)
    if (!url) {
      return await e.reply('请输入有效的网址', true)
    }

    try {
      const screenshotBase64 = await this.captureScreenshot(url)
      await e.reply(segment.image(`base64://${screenshotBase64}`), true)
    } catch (error) {
      await e.reply(`网页截图失败: ${error.message}`, true)
    }
  }

  extractUrlFromMessage (message) {
    let url = message.match(/^#?网页截图\s*(\S+.*)/)?.[1].trim()
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url
    }
    return url
  }

  async captureScreenshot (url) {
    if (!puppeteer.browser) {
      await puppeteer.browserInit()
    }
    const page = await puppeteer.browser.newPage()

    await page.setViewport({ width: 1920, height: 1080 })

    await page.goto(url, { waitUntil: 'load' })

    const screenshotBase64 = await page.screenshot({
      fullPage: true,
      type: 'jpeg',
      quality: 100,
      encoding: 'base64'
    })

    await page.close()
    return screenshotBase64
  }
}
