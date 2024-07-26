export function encodeToUrl(msg) {
  return encodeURIComponent(msg);
}

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
      await e.reply(`原始数据: ${msg}\n编码结果: ${encodedMsg}`);
    } catch (error) {
      await e.reply(`Error: ${error.message}`);
    }
  }

  async decodeFromUrlHandler(e) {
    let msg = e.msg.match(/^#?url解码\s*(.+)/)[1].trim();
    const decodedMsg = decodeFromUrl(msg);
    try {
      await e.reply(`原始数据: ${msg}\n解码结果: ${decodedMsg}`);
    } catch (error) {
      await e.reply(`Error: ${error.message}`);
    }
  }
}
