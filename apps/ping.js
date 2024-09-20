import puppeteer from 'puppeteer';

export class PingScreenshot extends plugin {
    constructor() {
        super({
            name: 'Ping 截图',
            dsc: '发送#ping网站或#tcpping网站, 截图对应页面中间部分',
            event: 'message',
            priority: 1,
            rule: [
                {
                    reg: `^#(ping|tcpping)\\s*(\\S+)$`,
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
        e.reply('正在获取Ping结果...请稍等......', true);
        // 提取命令类型 (ping 或 tcpping) 和网站名称
        const [, type, siteName] = e.msg.match(/^#(ping|tcpping)\s*(\S+)$/i);
        if (!siteName) {
            return await e.reply('?我怎么知道你要Ping什么玩意', true);
        }

        // 构建相应的 URL
        const url = `https://www.itdog.cn/${type}/${siteName}`;

        // 启动 Puppeteer 浏览器实例
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // 创建新的页面实例
        const page = await browser.newPage();

        try {
            // 访问指定的 URL，并等待页面加载完成
            await page.goto(url, { waitUntil: 'networkidle2' });

            // 使用 setTimeout 实现延时10秒，以确保所有内容加载完成
            await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒

            // 设置页面视口大小
            const viewportHeight = 1000; // 页面总高度
            await page.setViewport({ width: 1280, height: viewportHeight });

            // 获取页面高度，确保可以在不同屏幕尺寸下正常截图
            const pageHeight = await page.evaluate(() => document.body.scrollHeight);

            // 定义你想要截图的中间部分
            const clipHeight = 800; // 截图的高度
            const clipTop = (pageHeight - clipHeight) / 2; // 中间区域的顶部位置

            // 截取页面中间部分
            const screenshot = await page.screenshot({
                clip: {
                    x: 200,            // 截图区域的 x 坐标 (从左边开始)
                    y: clipTop,      // 截图区域的 y 坐标 (从顶部开始)
                    width: 1080,     // 截图的宽度
                    height: clipHeight // 截图的高度
                }
            });

            // 将截图发送给用户
            await this.reply(segment.image(screenshot));
        } catch (error) {
            // 发生错误时，回复用户无法获取网页截图
            await e.reply(`无法获取网页截图: ${error.message}`);
        } finally {
            // 关闭浏览器实例
            await browser.close();
        }
    }
}
