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
      name: 'url',
      dsc: 'url编码和解码',
      event: 'message',
      priority: 6,
      rule: [
        {
          reg: '^#?url编码\\s*(.+)',
          fnc: 'encodeToUrlHandler'
        },
        {
          reg: '^#?url解码\\s*(.+)',
          fnc: 'decodeFromUrlHandler'
        }
      ]
    });
  }

  async encodeToUrlHandler(e) {
    let msg = e.msg.match(/^#?url编码\s*(.+)/)[1].trim();
    const encodedMsg = encodeToUrl(msg);
    try {
      await e.reply(`编码结果: ${encodedMsg}`, true);
    } catch (error) {
      await e.reply(`Error: ${error.message}`, true);
    }
  }

  async decodeFromUrlHandler(e) {
    let msg = e.msg.match(/^#?url解码\s*(.+)/)[1].trim();
    const decodedMsg = decodeFromUrl(msg);
    try {
      await e.reply(`解码结果: ${decodedMsg}`, true);
    } catch (error) {
      await e.reply(`Error: ${error.message}`);
    }
  }
}
