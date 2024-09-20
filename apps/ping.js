import puppeteer from 'puppeteer';

export class PingScreenshot extends plugin {
    constructor() {
        super({
            name: 'Ping 截图',
            dsc: '发送#ping网站或#tcpping网站, 截图对应页面',
            event: 'message',
            priority: 100,
            rule: [
                {
                    reg: '^#(ping|tcpping)\\s*(\\S+)$',
                    fnc: 'handlePing'
                }
            ]
        });
    }

    /**
     * 处理Ping或TCPing命令
     * @param {Object} e - 事件对象
     * @returns {Promise<void>} - 返回一个 Promise，表示操作的异步结果
     */
    async handlePing(e) {
        e.reply('正在获取网页截图...请稍等......', true);
        const [, type, siteName] = e.msg.match(/^#(ping|tcpping)\s*(\S+)$/i);
        if (!siteName) {
            return await e.reply('我怎么知道你要ping什么网站呢？', true);
        }

        const url = `https://www.itdog.cn/${type}/${siteName}`;

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'networkidle2' });

            await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒

            await page.setViewport({ width: 1280, height: 1800 });

            const screenshot = await page.screenshot();

            await this.reply(segment.image(screenshot));
        } catch (error) {
            await e.reply(`无法获取网页截图: ${error.message}`);
        } finally {
            await browser.close();
        }
    }
}
