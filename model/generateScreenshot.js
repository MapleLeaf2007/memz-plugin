import puppeteer from '../../../lib/puppeteer/puppeteer.js'

export async function generateScreenshot (html) {
  try {
    if (!puppeteer.browser) {
      await puppeteer.browserInit()
    }

    const page = await puppeteer.browser.newPage()

    await page.setContent(html, { waitUntil: 'domcontentloaded' })

    // 自适应页面高度
    const height = await page.evaluate(() => document.documentElement.scrollHeight)

    const buffer = await page.screenshot({
      encoding: 'base64',
      clip: { x: 0, y: 0, width: 800, height }
    })

    await page.close()

    return buffer
  } catch (error) {
    logger.error(`[memz-plugin] Puppeteer 图片生成失败：${error.message}`)
  }
}
