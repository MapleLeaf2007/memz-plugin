import puppeteer from 'puppeteer';

const coinList = [
    'dnx', 'kas', 'rvn', 'btc', 'chia', 'clore', 'doge', 'ergo', 'eth', 'nexa', 'neoxa', 'rxd', 'xch', 'meme', 'pepe'
];
const urlList = {
    'dnx': "https://www.coincarp.com/zh/currencies/dynex/",
    'kas': "https://www.coincarp.com/zh/currencies/kaspa/",
    'rvn': "https://www.coincarp.com/zh/currencies/ravencoin/",
    'btc': "https://www.coincarp.com/zh/currencies/bitcoin/",
    'chia': "https://www.coincarp.com/zh/currencies/chianetwork/",
    'clore': "https://www.coincarp.com/zh/currencies/clore-ai/price/",
    'doge': "https://www.coincarp.com/zh/currencies/dogecoin/",
    'ergo': "https://www.bibiqing.com/coin/ergoplatform",
    'eth': "https://www.coincarp.com/zh/currencies/ethereum/",
    'nexa': "https://www.coincarp.com/zh/currencies/nexa-org/",
    'neoxa': "https://www.mytokencap.com/zh/currencies/neox/821838646/",
    'rxd': "https://www.coincarp.com/zh/currencies/radiant/",
    'xch': "https://www.coincarp.com/zh/currencies/chianetwork/",
    'meme': "https://www.coincarp.com/zh/currencies/meme-bsc/",
    'pepe': "https://www.coincarp.com/zh/currencies/pepe/"
};

export class WebPreview extends plugin {
    constructor() {
        super({
            name: '虚拟货币查询',
            dsc: '发送#查询币种,返回此币种价格网页截图',
            event: 'message',
            priority: 100,
            rule: [
                {
                    reg: `^#查询(币|b|B)种(${coinList.join('|')})$`,
                    fnc: 'preview'
                },
                {
                    reg: `^#?(b|B|币)种列表$`,
                    fnc: 'sendCoinList'
                }
            ]
        });
    }

    /**
     * 预览功能，生成网页截图并回复给用户
     * @param {Object} e - 事件对象
     * @returns {Promise<void>} - 返回一个 Promise，表示预览操作的异步结果
     */
    async preview(e) {
        /**
         * 从事件消息中提取要查询的币种名称，并转换为小写
         * @type {string}
         */
        const name = e.msg.replace(/#查询(币|b|B)种/i, '').trim().toLowerCase();

        /**
         * 根据币种名称获取对应的 URL
         * @type {string}
         */
        const url = urlList[name];

        // 如果未找到对应的 URL，回复用户未找到该币种的信息
        if (!url) {
            return await e.reply('未找到该币种的信息。');
        }

        /**
         * 启动 Puppeteer 浏览器实例
         * @type {import('puppeteer').Browser}
         */
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        /**
         * 创建新的页面实例
         * @type {import('puppeteer').Page}
         */
        const page = await browser.newPage();

        try {
            // 访问指定的 URL，并等待页面加载完成
            await page.goto(url, { waitUntil: 'networkidle2' });

            // 设置页面视口大小
            await page.setViewport({ width: 1000, height: 580 });

            // 生成网页截图
            const imgBuffer = await page.screenshot();

            // 将截图回复给用户
            await this.reply(segment.image(imgBuffer));
        } catch (error) {
            // 发生错误时，回复用户无法获取网页截图
            await e.reply(`无法获取网页截图: ${error.message}`);
        } finally {
            // 关闭浏览器实例
            await browser.close();
        }
    }


    /**
     * 发送币种列表
     * @param {Object} e - 事件对象
     * @returns {Promise<void>} - 返回一个 Promise，表示发送币种列表操作的异步结果
     */
    async sendCoinList(e) {
        /**
         * 构建回复消息
         * @type {string}
         */
        const replyMessage = '支持的币种列表：\n' + coinList.join('\n');

        // 发送币种列表回复消息给用户
        await this.reply(replyMessage);
    }
}
