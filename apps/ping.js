import puppeteer from 'puppeteer';

export class PingScreenshot extends plugin {
    constructor() {
        super({
            name: 'Ping 截图',
            dsc: '发送#ping网站或#tcping网站, 截图对应页面中间部分',
            event: 'message',
            priority: 1,
            rule: [
                {
                    reg: `^#(ping|tcping|dns)\\s*(\\S+)$`,
                    fnc: 'handlePing'
                }
            ]
        });
    }

    /**
     * 处理Ping/TCPing/dns命令
     * @param {Object} e - 事件对象
     * @returns {Promise<void>} - 返回一个 Promise，表示操作的异步结果
     */
    async handlePing(e) {
        e.reply('正在获取...请稍等......', true);
        const match = e.msg.match(/^#(ping|tcping|dns)\s*(\S+)$/i);
        if (!match) {
            return await e.reply('?我怎么知道你要干嘛', true);
        }
        const [, type, siteName] = match;

        const url = `https://www.itdog.cn/${type}/${siteName}`;

        logger.info(`[MEMZ-Plugin]${type}:${url}`);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'networkidle2' });

            // 等待“单次测试”按钮出现
            await page.waitForFunction(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some(btn => btn.textContent.includes('单次测试'));
            }, { timeout: 10000 });

            // 点击“单次测试”按钮
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(button => button.textContent.includes('单次测试'));
                if (btn) btn.click();
            });

            // 等待进度条达到100%
            let progress = 0;
            while (progress < 100) {
                progress = await page.evaluate(() => {
                    const progressElement = document.querySelector('#complete_progress > div');
                    if (progressElement) {
                        const text = progressElement.textContent;
                        const num = parseInt(text.replace('%', ''), 10);
                        return isNaN(num) ? 0 : num;
                    }
                    return 0;
                });
                if (progress >= 100) break;
                await new Promise(resolve => setTimeout(resolve, 500)); // 每半秒检查一次
            }

            // 设置视口大小并截图
            const viewportHeight = 1000;
            await page.setViewport({ width: 1420, height: viewportHeight });

            const pageHeight = await page.evaluate(() => document.body.scrollHeight);
            const clipHeight = 1000;
            const clipTop = (pageHeight - clipHeight) / 2;

            const screenshot = await page.screenshot({
                clip: {
                    x: 140,
                    y: clipTop,
                    width: 1245,
                    height: clipHeight
                }
            });
            await this.reply(segment.image(screenshot), true);
        } catch (error) {
            await e.reply(`无法获取网页截图: ${error.message}`);
        } finally {
            await browser.close();
        }
    }
}
