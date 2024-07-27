import puppeteer from 'puppeteer';

const coinList = [
    'dnx', 'kas', 'rvn', 'btc', 'chia', 'clore', 'doge', 'ergo', 'eth', 'nexa', 'neoxa', 'rxd', 'xch', 'meme', 'pepe'
];
const chajianku = '【Gitee】\nhttps://gitee.com/yhArcadia/Yunzai-Bot-plugins-index\n【Github】\nhttps://github.com/yhArcadia/Yunzai-Bot-plugins-index'
const url_list = {
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
            name: '网页预览',
            dsc: '发送#查询币种,返回此币种价格网页截图',
            event: 'message',
            priority: 100,
            rule: [
                {
                    reg: `^#查询(币|b|B)种(dnx|kas|rvn|btc|chia|clore|doge|ergo|eth|nexa|neoxa|rxd|xch|meme|pepe)$`,
                    fnc: 'preview'
                },
                {
                    reg: `^#?(b|B|币)种列表`,
                    fnc: 'sendCoinList'
                },
                {
                    reg: `^#?(yunzai|Yunzai|云崽|云崽bot|云崽机器人|云仔|云仔bot|云仔机器人)?(插件库|插件索引)`,
                    fnc: 'chajianku'
                },
            ]
        });
    }

    async preview(e) {
        const name = e.msg.replace(/#查询(币|b|B)种/i, '').trim();
        const url = url_list[name];
        if (!url) return await e.reply('未找到该币种的信息。');

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'networkidle2' });
            await page.setViewport({ width: 1000, height: 1200 });
            const imgBuffer = await page.screenshot();
            await this.reply(segment.image(imgBuffer));
        } catch (error) {
            await e.reply(`无法获取网页截图: ${error.message}`);
        } finally {
            await browser.close();
        }
    }

    async sendCoinList(e) {
        const replyMessage = '支持的币种列表：\n' + coinList.join('\n');
        await this.reply(replyMessage);
    }

    async chajianku(e) {
        await this.reply(chajianku);
    }
}
