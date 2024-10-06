import puppeteer from 'puppeteer';

export class PingScreenshot extends plugin {
    constructor() {
        super({
            name: '网络工具截图',
            dsc: '发送#ping网站、#tcping网站或#dns网站，截图对应页面顶部部分',
            event: 'message',
            priority: 1,
            rule: [
                {
                    reg: `^#(ping|tcping|dns)\\s*(\\S+)$`,
                    fnc: 'handleNetworkTest'
                }
            ]
        });
    }

    /**
     * 处理 Ping/TCPing/DNS 命令
     * @param {Object} e - 事件对象
     * @returns {Promise<void>} - 返回一个 Promise，表示操作的异步结果
     */
    async handleNetworkTest(e) {
        e.reply('正在获取数据...请稍等......', true);
        const match = e.msg.match(/^#(ping|tcping|dns)\s*(\S+)$/i);
        if (!match) {
            return await e.reply('我怎么知道你要干嘛!', true);
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

            const buttonText = type === 'dns' ? '开始测试' : '单次测试';

            await page.waitForFunction((btnText) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some(btn => btn.textContent.includes(btnText));
            }, { timeout: 10000 }, buttonText);

            await page.evaluate((btnText) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(button => button.textContent.includes(btnText));
                if (btn) btn.click();
            }, buttonText);

            let progress = 0;
            const progressSelector = '#complete_progress > div';
            while (progress < 100) {
                try {
                    await page.waitForSelector(progressSelector, { timeout: 5000 });
                } catch (err) {
                    logger.warn('进度条元素未找到，继续等待');
                }

                progress = await page.evaluate((selector) => {
                    const progressElement = document.querySelector(selector);
                    if (progressElement) {
                        const text = progressElement.textContent;
                        const num = parseInt(text.replace('%', ''), 10);
                        return isNaN(num) ? 0 : num;
                    }
                    return 0;
                }, progressSelector);

                if (progress >= 100) {
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // 页面视口大小
            const viewportHeight = 1000;
            await page.setViewport({ width: 1420, height: viewportHeight });
            logger.info('已设置视口大小');

            // 计算截图区域
            const clipHeight = 1000;
            const clipTop = 799;
            logger.info(`截图区域 - x: 140, y: ${clipTop}, width: 1245, height: ${clipHeight}`);

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
            logger.error(`Error in handleNetworkTest: ${error.stack}`);
            await e.reply(`无法获取网页截图: ${error.message}`, true);
        } finally {
            await browser.close();
        }
    }
}
