import { Config } from "../components/index.js";

export function encodeToUrl(msg) {
  return encodeURIComponent(msg);
}
export function decodeFromUrl(urlStr) {
  return decodeURIComponent(urlStr);
}
export class UrlPlugin extends plugin {
  constructor() {
    super({
      name: "url",
      dsc: "url编码和解码",
      event: "message",
      priority: 6,
      rule: [
        {
          reg: /^(#?)(url)(编码|解码)\s*(.+)/,
          fnc: "handleUrlEncodingDecoding",
        },
      ],
    });
  }

  async handleReply(e, handler) {
    const msg = e.msg.match(handler.reg);
    const operation = msg[2];
    const action = msg[3];
    const input = msg[4].trim();

    let result;
    try {
      if (operation === "url") {
        result = action === "编码" ? encodeToUrl(input) : decodeFromUrl(input);
      }

      await e.reply(`结果: ${result}`, true);
    } catch (error) {
      await e.reply(`Error: ${error.message}`);
    }
  }

  async handleUrlEncodingDecoding(e) {
    const { UrlAll } = Config.getConfig("memz");
    if (!UrlAll && !e.isMaster)
      return logger.warn("[memz-plugin]URL状态当前为仅主人可用");
    await this.handleReply(e, {
      reg: /^(#?)(url)(编码|解码)\s*(.+)/,
      fn: this.handleReply,
    });
  }
}
