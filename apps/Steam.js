import { load } from 'cheerio';
import axios from 'axios';
import https from 'https';

export class SteamGamesPlugin extends plugin {
    constructor() {
        super({
            name: 'Steam特惠游戏',
            dsc: '获取Steam特惠游戏信息',
            event: 'message',
            priority: 6,
            rule: [
                {
                    reg: /^#?(获取)?Steam今日免费游戏$/i,
                    fnc: 'fetchTodayFreeGamesHandler'
                },
                {
                    reg: /^#?获取Steam低于(\d+)(元|¥)?的游戏$/i,
                    fnc: 'fetchDiscountedGamesUnderPriceHandler'
                }
            ]
        });
    }

    // 游戏解析函数
    async fetchGames(url, priceLimit = null) {
        try {
            const httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });

            const { data } = await axios.get(url, { httpsAgent });
            const $ = load(data);
            let games = [];

            $('#search_resultsRows .search_result_row').each((index, element) => {
                const title = $(element).find('.search_name .title').text() || 'N/A';
                const priceText = $(element).find('.search_price .discount_final_price').text() || 'N/A';
                const originalPriceText = $(element).find('.search_price .discount_original_price').text() || 'N/A';
                const discountPercent = $(element).find('.search_price .discount_pct').text() || 'N/A';
                const reviewScore = $(element).find('.search_reviewscore span').attr('data-tooltip-html') || 'N/A';
                const price = parseFloat(priceText.replace(/[¥元,]/g, '') || Infinity);
                const link = $(element).attr('href');
                const imgSrc = $(element).find('.search_capsule img').attr('src') || '';

                if (!priceLimit || price <= priceLimit) {
                    games.push({ title, priceText, originalPriceText, discountPercent, reviewScore, link, imgSrc });
                }
            });

            return games.length > 50 ? games.slice(0, 50) : games;
        } catch (error) {
            throw new Error(`请求出错: ${error.message}`);
        }
    }

    // 构建转发消息
    async buildForwardMessage(games, e) {
        if (games.length === 0) {
            await e.reply('没有符合条件的游戏!', true);
        } else {
            const forward = games.map(game => ({
                user_id: 382879217,
                nickname: 'ZSY11',
                message: [
                    `标题: ${game.title}\n原价: ${game.originalPriceText || 'N/A'}\n现价: ${game.priceText || 'N/A'}\n折扣: ${game.discountPercent || 'N/A'}\n好评度: ${game.reviewScore || 'N/A'}\n链接: ${game.link}\n图片:`,
                    segment.image(game.imgSrc)
                ]
            }));
            const nmsg = await Bot.makeForwardMsg(forward);
            await e.reply(nmsg);
        }
    }

    // 错误处理
    async handleError(e, error) {
        await e.reply(`错误: ${error.message}`, true);
    }

    // 获取今日免费游戏
    async fetchTodayFreeGamesHandler(e) {
        const url = 'https://store.steampowered.com/search/results?force_infinite=1&maxprice=free&specials=1&ndl=1&snr=1_7_7_230_7';
        try {
            const games = await this.fetchGames(url);
            await this.buildForwardMessage(games, e);
        } catch (error) {
            await this.handleError(e, error);
        }
    }

    // 获取低于指定价格的特惠游戏
    async fetchDiscountedGamesUnderPriceHandler(e) {
        const match = e.msg.match(/^#?获取Steam低于(\d+)(元|¥)?的游戏$/i);
        const priceLimit = match ? parseInt(match[1], 10) : null;
        const url = `https://store.steampowered.com/search/results?force_infinite=1&maxprice=${priceLimit}&specials=1&ndl=1&snr=1_7_7_230_7`;

        try {
            const games = await this.fetchGames(url, priceLimit);
            await this.buildForwardMessage(games, e);
        } catch (error) {
            await this.handleError(e, error);
        }
    }
}
