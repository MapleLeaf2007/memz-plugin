import punycode from 'punycode';

process.noDeprecation = true;

/**
 * 将字符串编码为 Punycode 格式
 * @param {string} msg - 要编码的字符串
 * @returns {string} - 返回编码后的 Punycode 字符串
 */
export function encodeToPunycode(msg) {
  return `xn--${punycode.encode(msg)}`;
}

/**
 * 将 Punycode 字符串解码为普通字符串
 * @param {string} punycodeStr - 要解码的 Punycode 字符串
 * @returns {string} - 返回解码后的普通字符串
 */
export function decodeFromPunycode(punycodeStr) {
  return punycode.decode(punycodeStr.replace(/^xn--/, ''));
}

/**
 * 将字符串编码为 Unicode 格式
 * @param {string} msg - 要编码的字符串
 * @returns {string} - 返回编码后的 Unicode 字符串
 */
export function encodeToUnicode(msg) {
  return msg.split('').map(char => {
    const code = char.charCodeAt(0).toString(16).padStart(4, '0');
    return `\\u${code}`;
  }).join('');
}

/**
 * 将 Unicode 字符串解码为普通字符串
 * @param {string} unicodeStr - 要解码的 Unicode 字符串
 * @returns {string} - 返回解码后的普通字符串
 */
export function decodeFromUnicode(unicodeStr) {
  return unicodeStr.replace(/\\u[\dA-Fa-f]{4}/g, match =>
    String.fromCharCode(parseInt(match.replace('\\u', ''), 16))
  );
}

/**
 * 将字符串编码为 ASCII 格式
 * @param {string} msg - 要编码的字符串
 * @returns {string} - 返回编码后的 ASCII 字符串
 */
export function encodeToAscii(msg) {
  return msg.split('').map(char => {
    const code = char.charCodeAt(0);
    return `\\x${code.toString(16).padStart(2, '0')}`;
  }).join('');
}

/**
 * 将 ASCII 字符串解码为普通字符串
 * @param {string} asciiStr - 要解码的 ASCII 字符串
 * @returns {string} - 返回解码后的普通字符串
 */
export function decodeFromAscii(asciiStr) {
  return asciiStr.replace(/\\x[\dA-Fa-f]{2}/g, match =>
    String.fromCharCode(parseInt(match.replace('\\x', ''), 16))
  );
}

export class Unicode extends plugin {
  constructor() {
    super({
      name: 'unicode',
      dsc: 'unicode',
      event: 'message',
      priority: 6,
      rule: [
        { reg: '^#?unicode编码\\s*(.+)', fnc: 'encodeToUnicodeHandler' },
        { reg: '^#?unicode解码\\s*(.+)', fnc: 'decodeFromUnicodeHandler' },
        { reg: '^#?ascii编码\\s*(.+)', fnc: 'encodeToAsciiHandler' },
        { reg: '^#?ascii解码\\s*(.+)', fnc: 'decodeFromAsciiHandler' },
        { reg: '^#?punycode编码\\s*(.+)', fnc: 'encodeToPunycodeHandler' },
        { reg: '^#?punycode解码\\s*(.+)', fnc: 'decodeFromPunycodeHandler' },
      ]
    });
  }

  /**
   * 处理回复的异步函数
   * @param {Object} e - 事件对象
   * @param {Object} handler - 处理程序对象
   * @returns {Promise<void>}
   */
  async handleReply(e, handler) {
    // 从事件对象中获取消息并匹配处理程序的正则表达式
    const msg = e.msg.match(handler.reg)[1].trim();
    let result;
    try {
      // 根据处理程序的isEncode属性选择是否对消息进行编码处理
      result = handler.isEncode ? handler.fn(msg) : handler.fn(msg);
      // 将结果作为回复消息发送
      await e.reply(`结果:${result}`, true);
    } catch (error) {
      // 发生错误时，将错误信息作为回复消息发送
      await e.reply(`Error: ${error.message}`);
    }
  }

  async encodeToUnicodeHandler(e) {
    await this.handleReply(e, { reg: /^#?unicode编码\s*(.+)/, fn: encodeToUnicode, isEncode: true });
  }

  async decodeFromUnicodeHandler(e) {
    await this.handleReply(e, { reg: /^#?unicode解码\s*(.+)/, fn: decodeFromUnicode, isEncode: false });
  }

  async encodeToAsciiHandler(e) {
    await this.handleReply(e, { reg: /^#?ascii编码\s*(.+)/, fn: encodeToAscii, isEncode: true });
  }

  async decodeFromAsciiHandler(e) {
    await this.handleReply(e, { reg: /^#?ascii解码\s*(.+)/, fn: decodeFromAscii, isEncode: false });
  }

  async encodeToPunycodeHandler(e) {
    await this.handleReply(e, { reg: /^#?punycode编码\s*(.+)/, fn: encodeToPunycode, isEncode: true });
  }

  async decodeFromPunycodeHandler(e) {
    await this.handleReply(e, { reg: /^#?punycode解码\s*(.+)/, fn: decodeFromPunycode, isEncode: false });
  }
}
