import puppeteer from "../../../lib/puppeteer/puppeteer.js"; // 根据你的项目结构调整路径

export async function generateScreenshot(html) {
  try {
    if (!puppeteer.browser) {
      await puppeteer.browserInit();
    }

    const page = await puppeteer.browser.newPage();

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const buffer = await page.screenshot({
      encoding: "base64",
      viewport: { width: 800 },
      fullPage: true,
    });

    await page.close();

    return buffer;
  } catch (error) {
    throw new Error(`Puppeteer 截图生成失败：${error.message}`);
  }
}
