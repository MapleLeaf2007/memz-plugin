import { Config } from "../components/index.js";
const { UrlAll } = Config.getConfig("memz");
/**
 * 将字符串编码为 URL 格式
 * @param {string} msg - 要编码的字符串
 * @returns {string} - 返回编码后的 URL 字符串
 */
export function encodeToUrl(msg) {
  return encodeURIComponent(msg);
}

/**
 * 从 URL 字符串中解码
 * @param {string} urlStr - 要解码的 URL 字符串
 * @returns {string} - 返回解码后的字符串
 */
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
    const operation = msg[2]; // 'url'
    const action = msg[3]; // '编码' or '解码'
    const input = msg[4].trim();

    let result;
    try {
      // 根据操作类型选择相应的函数进行编码或解码
      if (operation === "url") {
        result = action === "编码" ? encodeToUrl(input) : decodeFromUrl(input);
      }

      await e.reply(`结果: ${result}`, true);
    } catch (error) {
      await e.reply(`Error: ${error.message}`);
    }
  }

  async handleUrlEncodingDecoding(e) {
    if (!UrlAll && !e.isMaster)
      return logger.warn("[memz-plugin]URL状态当前为仅主人可用");
    await this.handleReply(e, {
      reg: /^(#?)(url)(编码|解码)\s*(.+)/,
      fn: this.handleReply,
    });
  }
}
