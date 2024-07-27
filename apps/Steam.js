import fetch from 'node-fetch';
import cheerio from 'cheerio';

export class Steam extends plugin {
    constructor() {
        super({
            name: 'Steam功能',
            dsc: 'Steam功能',
            event: 'message',
            priority: -1,
            rule: [
                {
                    reg: /^#?steam喜加一$/i,
                    fnc: 'steamxi',
                }
            ]
        })
    }

    async steamxi(e) {
        const url = 'https://steamstats.cn/xi';
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.72 Safari/537.36 Edg/90.0.818.41'
        };

        try {
            const response = await fetch(url, { headers });
            if (!response.ok) {
                this.e.reply(`HTTP错误! 状态码: ${response.status}`);
            }
            const html = await response.text();
            const $ = cheerio.load(html);
            const tbody = $('tbody');
            const tr = tbody.find('tr');
            let text = "🎮Steam今日🆓喜加一列表💡" + '\n';

            tr.each((i, element) => {
                const td = $(element).find('td');
                const name = td.eq(1).text().trim().replace(/\s+/g, ' ');
                const gametype = td.eq(2).text().trim().replace(/\s+/g, ' ');
                const start = td.eq(3).text().trim().replace(/\s+/g, ' ');
                const end = td.eq(4).text().trim().replace(/\s+/g, ' ');
                const time = td.eq(5).text().trim().replace(/\s+/g, ' ');
                const origin = td.eq(6).find('span').text().trim().replace(/\s+/g, ' ');

                text += `🔢序号：${i + 1}\n🎮游戏名称：${name}\n🌟DLC/game：${gametype}\n⌛️开始时间：${start}\n⌛️结束时间：${end}\n😄是否永久：${time}\n📦平台：${origin}\n`;
            });
            this.e.reply(text)
        } catch (error) {
            this.e.reply('获取或解析数据时出错:', error);
        }
    }
}