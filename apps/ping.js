import puppeteer from 'puppeteer';

export class PingScreenshot extends plugin {
    constructor() {
        super({
            name: 'Ping 截图',
            dsc: '发送#ping网站或#tcping网站, 截图对应页面顶部部分',
            event: 'message',
            priority: 1,
            rule: [
                {
                    reg: `^#(ping|tcping)\\s*(\\S+)$`,
                    fnc: 'handlePing'
                }
            ]
        });
    }

    /**
     * 处理Ping/TCPing命令
     * @param {Object} e - 事件对象
     * @returns {Promise<void>} - 返回一个 Promise，表示操作的异步结果
     */
    async handlePing(e) {
        e.reply('正在获取Ping数据...请稍等......', true, { recallMsg: 10 });
        const match = e.msg.match(/^#(ping|tcping)\s*(\S+)$/i);
        if (!match) {
            return await e.reply('?我怎么知道你要干嘛!', true);
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
            // 导航到目标URL
            await page.goto(url, { waitUntil: 'networkidle2' });

            // 等待“单次测试”按钮出现
            await page.waitForFunction(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some(btn => btn.textContent.includes('单次测试'));
            }, { timeout: 10000 });


            const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => null);

            // 点击“单次测试”按钮
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(button => button.textContent.includes('单次测试'));
                if (btn) btn.click();
            });

            // 等待加载进度条达到100%
            let progress = 0;
            const progressSelector = '#complete_progress > div';
            while (progress < 100) {
                try {
                    // 使用 CSS 选择器等待进度条元素出现
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

                // 每半秒检查一次进度
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
            logger.error(`Error in handlePing: ${error.stack}`);
            await e.reply(`无法获取网页截图: ${error.message}`, true);
        } finally {
            await browser.close();
        }
    }
}
