import { Config } from "../components/index.js";
const { search_movie } = Config.getConfig("memz");
export class VideoAPI extends plugin {
  constructor() {
    super({
      name: "搜影视",
      dsc: "搜影视",
      event: "message",
      priority: 100,
      rule: [
        {
          reg: "^#?搜影视\\s*(\\S+)$",
          fnc: "preview",
        },
      ],
    });
  }

  async preview(e) {
    if (!search_movie) return logger.warn("[memz-plugin]搜影视功能已禁用");
    const match = e.msg.match(/^#?搜影视\s*(\S+)$/);
    const keyword = match ? match[1] : null;

    if (!keyword) {
      return await e.reply("请输入关键词进行搜索！", true);
    }

    try {
      const results = await this.searchResources(keyword);
      if (results.length > 0) {
        const forward = results.map((row) => ({
          user_id: 382879217,
          nickname: "ZSY11",
          message: [
            `名称: ${row.name}\n链接: ${row.link}\n分类: ${row.category}`,
          ],
        }));
        const nmsg = await Bot.makeForwardMsg(forward);
        await e.reply(nmsg);
      } else {
        await e.reply("未找到匹配的结果。", true);
      }
    } catch (error) {
      await e.reply(`搜索过程中发生错误：${error.message}`, true);
    }
  }

  async searchResources(keyword) {
    const apiUrl = `https://ysxjjkl.souyisou.top/api_searchtxt.php?name=${encodeURIComponent(keyword)}`;

    try {
      const response = await fetch(apiUrl);
      const text = await response.text();

      if (text.includes("[可怜]对不起，本资源暂未收录")) {
        return [];
      }

      const results = [];
      const warningNotice = text.includes("【注意】以下资源来自网络搜索");
      const items = text.split("\n名称：").slice(1); // 分割各项资源

      for (const item of items) {
        const nameMatch = item.match(/^(.*?)\s*链接：/);
        const linkMatch = item.match(/链接：(https:\/\/.+?)(?=\s|$)/);

        if (nameMatch && linkMatch) {
          results.push({
            name: nameMatch[1].trim(),
            category: warningNotice ? "网络搜索资源" : "影视资源",
            link: linkMatch[1],
          });
        }
      }

      return results;
    } catch (error) {
      console.error("请求出错:", error);
      throw new Error("资源搜索失败");
    }
  }
}
