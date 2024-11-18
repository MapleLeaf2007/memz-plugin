const BilBil热榜接口 = 'http://127.0.0.1:1129/bilbilhot';
export class BilBil热榜插件 extends plugin {
    constructor() {
        super({
            name: "BilBil热榜插件",
            dsc: "查询 Bilibili 热榜",
            event: "message",
            priority: 9,
            rule: [
                {
                    reg: /^#?(B站|Bilibili)(熱榜|热榜|热门)(榜单)?$/i,
                    fnc: "获取BilBil热榜",
                }
            ],
        });
    }

    async 获取BilBil热榜(e) {
        try {
            const 响应 = await fetch(BilBil热榜接口);
            if (!响应.ok) { throw new Error(`HTTP error! status: ${响应.status}`) }
            const 数据 = await 响应.json();
            if (数据.code !== 0) { throw new Error(`API 返回错误: ${数据.message}`) }
            let 回复消息 = `Bilibili 热榜\n更新时间：${new Date(数据.time).toLocaleString()}\n`;
            数据.data.forEach((item, index) => {
                回复消息 += `${index + 1}. ${item.show_name}（热度：${item.heat_score}）\n`;
            });

            e.reply(回复消息.trim(), true);
        } catch (错误) {
            e.reply(`抱歉，获取 Bilibili 热榜失败，请稍后再试！\n错误信息：${错误.message}`, true);
            logger.error('获取Bilibili热榜失败', 错误);
        }
    }
}
