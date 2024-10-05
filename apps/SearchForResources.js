import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'node:path';
import { fileURLToPath } from 'url';

// 获取当前文件名和目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const Filename = path.join(__dirname, '..', 'data', '本地搜索.db');

// 打开数据库
async function openDatabase() {
    return open({
        filename: Filename,
        driver: sqlite3.Database
    });
}

// 添加资源
async function addResource(keyword, url, category) {
    const db = await openDatabase();
    const existingResource = await db.get('SELECT * FROM 自定义词库 WHERE 内容 = ?', [url]);
    if (existingResource) {
        console.log('该资源已存在');
        await db.close();
        return null;
    }

    const result = await db.get('SELECT MAX(ID) AS maxId FROM 自定义词库');
    const newId = result.maxId ? result.maxId + 1 : 1;
    await db.run('INSERT INTO 自定义词库 (ID, 关键词, 内容, 分类) VALUES (?, ?, ?, ?)', [newId, keyword, url, category]);
    console.log('资源已添加:', { ID: newId, 关键词: keyword, 内容: url, 分类: category });
    await db.close();
    return { ID: newId, 关键词: keyword, 内容: url, 分类: category };
}

// 删除资源
async function deleteResource(id) {
    const db = await openDatabase();
    const result = await db.run('DELETE FROM 自定义词库 WHERE ID = ?', [id]);
    await db.close();
    return result.changes > 0;
}

// 查看资源
async function viewResource(id) {
    const db = await openDatabase();
    const resource = await db.get('SELECT * FROM 自定义词库 WHERE ID = ?', [id]);
    await db.close();
    return resource;
}

// 搜索资源
async function searchResources(keyword) {
    const db = await openDatabase();
    const results = await db.all('SELECT * FROM 自定义词库 WHERE 关键词 LIKE ?', `%${keyword}%`);
    await db.close();
    return results;
}

async function getResourceCountsByCategory() {
    const db = await openDatabase();
    const counts = await db.all(`
        SELECT
            COALESCE(分类, '未分类') AS 分类,
            COUNT(*) AS 数量
        FROM 自定义词库
        GROUP BY 分类
    `);
    await db.close();
    return counts;
}

// 插件定义
export class ResourceSearchPlugin extends plugin {
    constructor() {
        super({
            name: '资源搜索',
            dsc: '根据关键词搜索自定义词库，或添加、删除、查看资源，以及查看分类统计',
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
                },
                {
                    reg: '^#?资源删除\\s*(\\d+)$',
                    fnc: 'handleDeleteResource'
                },
                {
                    reg: '^#?查看资源\\s*(\\d+)$',
                    fnc: 'handleViewResource'
                },
                {
                    reg: '^#?资源(数量|个数)?(总数|统计)$',
                    fnc: 'handleGetResourceCounts'
                }
            ]
        });
    }

    async handleSearch(e) {
        const match = e.msg.match(/^#?搜资源\s*(\S+)$/);
        const keyword = match ? match[1] : null;

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

                const nmsg = await Bot.makeForwardMsg(forward);
                await e.reply(nmsg);
            } else {
                await e.reply('未找到匹配的结果。', true);
            }
        } catch (error) {
            await e.reply(`搜索过程中发生错误：${error.message}`, true);
        }
    }

    async handleAddResource(e) {
        if (!(e.isMaster || e.user_id == 382879217 || e.user_id == 1011303349)) {
            return e.reply('你没有权限!', true);
        }

        const match = e.msg.match(/^#?资源添加\s*(\S+),\s*(\S+),\s*(\S+)$/);
        if (!match) {
            return e.reply('请按照格式输入: #资源添加 关键词, 链接, 分类', true);
        }

        const keyword = match[1];
        const url = match[2];
        const category = match[3];

        try {
            const newResource = await addResource(keyword, url, category);
            if (newResource) {
                await e.reply(`资源已添加: ID: ${newResource.ID}, 关键词: ${newResource.关键词}, 内容: ${newResource.内容}, 分类: ${newResource.分类}`, true);
            } else {
                await e.reply('该资源已存在', true);
            }
        } catch (error) {
            await e.reply(`添加资源时发生错误：${error.message}`, true);
        }
    }

    async handleDeleteResource(e) {
        if (!(e.isMaster || e.user_id == 382879217 || e.user_id == 1011303349)) {
            return e.reply('你没有权限!', true);
        }

        const match = e.msg.match(/^#?资源删除\s*(\d+)$/);
        if (!match) {
            return e.reply('请按照格式输入: #资源删除 ID', true);
        }

        const id = match[1];

        try {
            const deleted = await deleteResource(id);
            if (deleted) {
                await e.reply(`资源 ID: ${id} 已成功删除。`, true);
            } else {
                await e.reply(`未找到 ID: ${id} 的资源。`, true);
            }
        } catch (error) {
            await e.reply(`删除资源时发生错误：${error.message}`, true);
        }
    }

    async handleViewResource(e) {
        const match = e.msg.match(/^#?查看资源\s*(\d+)$/);
        if (!match) {
            return e.reply('请按照格式输入: #查看资源 ID', true);
        }

        const id = match[1];

        try {
            const resource = await viewResource(id);
            if (resource) {
                await e.reply(`ID: ${resource.ID}\n关键词: ${resource.关键词}\n内容: ${resource.内容}\n分类: ${resource.分类}`, true);
            } else {
                await e.reply(`未找到 ID: ${id} 的资源。`, true);
            }
        } catch (error) {
            await e.reply(`查看资源时发生错误：${error.message}`, true);
        }
    }

    async handleGetResourceCounts(e) {
        try {
            const counts = await getResourceCountsByCategory();
            if (counts.length > 0) {
                let message = '资源分类总数统计：\n';
                counts.forEach(row => {
                    message += `分类: ${row.分类} - 数量: ${row.数量}\n`;
                });
                await e.reply(message, true);
            } else {
                await e.reply('没有找到任何资源。', true);
            }
        } catch (error) {
            await e.reply(`获取资源总数时发生错误：${error.message}`, true);
        }
    }
}
