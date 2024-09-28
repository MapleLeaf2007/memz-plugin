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
        const [, type, siteName] = e.msg.match(/^#(ping|tcping|dns)\s*(\S+)$/i);
        if (!siteName) {
            return await e.reply('?我怎么知道你要干嘛', true)
        }

        const url = `https://www.itdog.cn/${type}/${siteName}`;
        logger.info(`[MEMZ-Plugin]${type} : ${url}`);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'networkidle2' });

            // 点击按钮
            await page.click('button.btn.btn-primary.ml-3.mb-3');

            // 等待7秒
            await new Promise(resolve => setTimeout(resolve, 7000));

            // 设置页面视口大小
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
