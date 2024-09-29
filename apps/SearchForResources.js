import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// 打开数据库
async function openDatabase() {
    return open({
        filename: './plugins/memz-plugin/data/本地搜索.db',
        driver: sqlite3.Database
    });
}

// 添加资源
async function addResource(keyword, url, category) {
    const db = await openDatabase();

    // 检索是否已存在相同的内容
    const existingResource = await db.get('SELECT * FROM 自定义词库 WHERE 内容 = ?', [url]);
    if (existingResource) {
        console.log('该资源已存在，未添加。');
        await db.close();
        return;
    }

    // 获取当前最大 ID
    const result = await db.get('SELECT MAX(ID) AS maxId FROM 自定义词库');
    const newId = result.maxId ? result.maxId + 1 : 1;

    // 插入新资源
    await db.run('INSERT INTO 自定义词库 (ID, 关键词, 内容, 分类) VALUES (?, ?, ?, ?)', [newId, keyword, url, category]);
    console.log('资源已添加:', { ID: newId, 关键词: keyword, 内容: url, 分类: category });

    await db.close();
}

// 搜索资源
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
            dsc: '根据关键词搜索自定义词库，或添加新资源',
            event: 'message',
            priority: 1,
            rule: [
                {
                    reg: '^#?搜资源\\s*(\\S+)$',
                    fnc: 'handleSearch'
                },
                {
                    reg: '^#?资源添加\\s*(\\S+),\\s*(\\S+),\\s*(\\S+)$',
                    fnc: 'handleAddResource'
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
                    user_id: 382879217,
                    nickname: 'ZSY11',
                    message: [
                        `ID: ${row.ID}\n名称: ${row.关键词}\n链接: ${row.内容}\n分类: ${row.分类}`
                    ]
                }));

                const nmsg = await Bot.makeForwardMsg(`---点击查看搜索结果---`, forward);

                await e.reply(nmsg);
            } else {
                await e.reply('未找到匹配的结果。', true);
            }
        } catch (error) {
            await e.reply(`搜索过程中发生错误：${error.message}`, true);
        }
    }

    /**
     * 处理添加资源命令
     * @param {Object} e - 事件对象
     */
    async handleAddResource(e) {
        if (!(e.user_id == 382879217 || e.user_id == 1011303349)) return e.reply('你没有权限!', true);
        const match = e.msg.match(/^#?资源添加\s*(\S+),\s*(\S+),\s*(\S+)$/);
        const keyword = match[1];
        const url = match[2];
        const category = match[3];

        if (!keyword || !url || !category) {
            return await e.reply('参数不完整，添加失败。请确保格式为：#添加资源关键词,url,分类', true);
        }

        try {
            await addResource(keyword, url, category);
            await e.reply('资源已成功添加！', true);
        } catch (error) {
            await e.reply(`添加资源时发生错误：${error.message}`, true);
        }
    }
}
