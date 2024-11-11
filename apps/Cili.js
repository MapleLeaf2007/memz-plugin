import { Config } from "../components/index.js";
const { search_magnet } = Config.getConfig("memz-config");
export class Cili extends plugin {
    constructor() {
        super({
            name: "磁力搜索",
            dsc: "从cili.site抓取磁力资源",
            event: "message",
            priority: 6,
            rule: [
                {
                    reg: "^#?磁力搜索\\s*(.+)",
                    fnc: "fetchSearchResults",
                }
            ],
        });
    }

    async fetchSearchResults(e) {
        if (!search_magnet && !e.isMaster) return logger.warn("[memz-plugin]磁力搜索状态当前为仅主人可用");
        const msg = e.msg;
        const searchQuery = msg.match(/^#?磁力搜索\s*(.+)$/)[1];
        if (!searchQuery) {
            return await e.reply("请输入有效的搜索关键词！", true);
        }
        const url = `https://cili.site/search?q=${encodeURIComponent(searchQuery)}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('请求失败，状态码：' + response.status);
            }
            const data = await response.text();
            const results = [];
            const regex = /<tr>[\s\S]*?<td>[\s\S]*?<a href="([^"]+)">[\s\S]*?<p class="sample">([^<]+)<\/p>[\s\S]*?<\/a>[\s\S]*?<\/td>[\s\S]*?<td class="td-size">([^<]+)<\/td>/g;
            let match;
            while ((match = regex.exec(data)) !== null) {
                const link = `https://cili.site${match[1]}`;
                const title = match[2].trim();
                const size = match[3].trim();
                results.push({ title, size, link });
            }

            if (results.length > 0) {
                const forward = results.map((row) => ({
                    user_id: 2173302144,
                    nickname: "为什么不玩原神",
                    message: [
                        `名称: ${row.title}\n文件大小: ${row.size}\n下载链接: ${row.link}`,
                    ],
                }));
                const nmsg = await Bot.makeForwardMsg(forward);
                await e.reply(nmsg);
            } else {
                await e.reply("未找到匹配的资源。", true);
            }
        } catch (error) {
            logger.error('获取数据时出错:', error);
            await e.reply("搜索过程中发生错误，请稍后再试。", true);
        }
    }
}
