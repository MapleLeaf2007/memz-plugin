import { load } from 'cheerio';
import axios from 'axios';

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
                    reg: '^#获取Steam低于(\\d+)(元|¥)?的游戏$',
                    fnc: 'fetchDiscountedGamesUnderPriceHandler'
                }
            ]
        });
    }

    async fetchTodayFreeGamesHandler(e) {
        const url = 'https://store.steampowered.com/search/results?force_infinite=1&maxprice=free&specials=1&ndl=1&snr=1_7_7_230_7';

        try {
            const { data } = await axios.get(url);
            const $ = load(data);
            const games = [];

            $('#search_resultsRows .search_result_row').each((index, element) => {
                const title = $(element).find('.search_name .title').text() || 'N/A';
                const price = $(element).find('.search_price_discount_combined .discount_final_price').text() || 'N/A';
                const link = $(element).attr('href');
                const imgSrc = $(element).find('.search_capsule img').attr('src') || '';

                games.push({ title, price, link, imgSrc });
            });

            if (games.length === 0) {
                await e.reply('今天没有免费游戏!', true);
            } else {
                const forward = games.map(game => ({
                    user_id: 382879217,
                    nickname: 'ZSY11',
                    message: [
                        `标题: ${game.title}\n价格: ${game.price}\n链接: ${game.link}\n图片:`, segment.image(game.imgSrc)
                    ]
                }));

                const nmsg = await Bot.makeForwardMsg(forward);
                await e.reply(nmsg);
            }
        } catch (error) {
            await e.reply(`错误: ${error.message}`, true);
        }
    }

    async fetchDiscountedGamesUnderPriceHandler(e) {
        const match = e.msg.match(/^#获取Steam低于(\d+)(元|¥)?的游戏$/);
        const priceLimit = match ? match[1] : null;
        const url = `https://store.steampowered.com/search/results?force_infinite=1&maxprice=${priceLimit}&specials=1&ndl=1&snr=1_7_7_230_7`;

        try {
            const { data } = await axios.get(url);
            const $ = load(data);
            const games = [];

            $('#search_resultsRows .search_result_row').each((index, element) => {
                const title = $(element).find('.search_name .title').text() || 'N/A';
                const price = $(element).find('.search_price_discount_combined .discount_final_price').text() || 'N/A';
                const link = $(element).attr('href');
                const imgSrc = $(element).find('.search_capsule img').attr('src') || '';

                games.push({ title, price, link, imgSrc });
            });

            if (games.length === 0) {
                await e.reply(`没有低于${priceLimit}元的特惠游戏!`, true);
            } else {
                const forward = games.map(game => ({
                    user_id: 382879217,
                    nickname: 'ZSY11',
                    message: [
                        `标题: ${game.title}\n价格: ${game.price}\n链接: ${game.link}\n图片:`, segment.image(game.imgSrc)
                    ]
                }));

                const nmsg = await Bot.makeForwardMsg(forward);
                await e.reply(nmsg);
            }
        } catch (error) {
            await e.reply(`错误: ${error.message}`, true);
        }
    }
}
