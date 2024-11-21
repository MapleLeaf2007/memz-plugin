import { Config } from "../components/index.js";

export async function fetchSeoFromHtml(url) {
  const response = await fetch(url);
  const html = await response.text();

  // 使用正则表达式提取 title、description、keywords
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const descriptionMatch = html.match(
    /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i,
  );
  const keywordsMatch = html.match(
    /<meta\s+name=["']keywords["']\s+content=["'](.*?)["']/i,
  );

  return {
    title: titleMatch ? titleMatch[1] : "未找到标题",
    description: descriptionMatch ? descriptionMatch[1] : "未找到描述",
    keywords: keywordsMatch ? keywordsMatch[1] : "未找到关键词",
  };
}

export class SeoPlugin extends plugin {
  constructor() {
    super({
      name: "seo",
      dsc: "抓取网站SEO信息",
      event: "message",
      priority: 6,
      rule: [
        {
          reg: "^#?seo\\s*(.+)",
          fnc: "fetchSeoInfoHandler",
        },
      ],
    });
  }

  async fetchSeoInfoHandler(e) {
    const { SeoAll } = Config.getConfig("memz");
    if (!SeoAll && !e.isMaster)
      return logger.warn("[memz-plugin]Seo状态当前为仅主人可用");
    let url = e.msg.match(/^#?seo\s*(.+)/)[1].trim();
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }

    try {
      const seoInfo = await fetchSeoFromHtml(url);
      const result = `SEO信息:\n页面标题: ${seoInfo.title}\n描述: ${seoInfo.description}\n关键词: ${seoInfo.keywords}`;
      await e.reply(result, true);
    } catch (error) {
      await e.reply(`抓取失败: ${error.message}`, true);
    }
  }
}
