import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
// 数据库
async function openDatabase() {
    return open({
        filename: './plugins/memz-plugin/data/本地搜索.db',
        driver: sqlite3.Database
    });
}
// 搜索
async function searchResources(keyword) {
    const db = await openDatabase();
    const results = await db.all('SELECT * FROM 自定义词库 WHERE 关键词 LIKE ?', `%${keyword}%`);
    await db.close();
    return results;
}
// 插件定义
export class ResourceSearchPlugin extends plugin {
    constructor() {
        super({
            name: '资源搜索',
            dsc: '根据关键词搜索自定义词库',
            event: 'message',
            priority: 1,
            rule: [
                {
                    reg: '^#?搜资源\\s*(\\S+)$',
                    fnc: 'handleSearch'
                }
            ]
        });
    }
    /**
     * 处理搜索命令
     * @param {Object} e - 事件对象
     */
    async handleSearch(e) {
        const match = e.msg.match(/^#?搜资源\s*(\S+)$/);
        const keyword = match ? match[1] : null; // 使用正则捕获

        if (!keyword) {
            return await e.reply('请输入关键词进行搜索！', true);
        }
        try {
            const results = await searchResources(keyword);
            if (results.length > 0) {
                const forward = results.map(row => ({
                    user_id: 382879217, // 示例用户 ID
                    nickname: 'ZSY11', // 示例昵称
                    message: [
                        `ID: ${row.ID}\n名称: ${row.关键词}\n链接: ${row.内容}\n分类: ${row.分类}`
                    ]
                }));

                const nmsg = await Bot.makeForwardMsg(forward);

                await e.reply(nmsg);
            } else {
                await e.reply('未找到匹配的结果。', true);
            }
        } catch (error) {
            await e.reply(`搜索过程中发生错误：${error.message}`, true);
        }
    }
}
