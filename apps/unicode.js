export function encodeToUnicode(msg) {
  return msg.split('').map(char => {
    const code = char.charCodeAt(0).toString(16).padStart(4, '0');
    return `\\u${code}`;
  }).join('');
}

export function decodeFromUnicode(unicodeStr) {
  return unicodeStr.replace(/\\u[\dA-Fa-f]{4}/g, match => {
    return String.fromCharCode(parseInt(match.replace('\\u', ''), 16));
  });
}

export function encodeToAscii(msg) {
  return msg.split('').map(char => {
    const code = char.charCodeAt(0);
    return `\\x${code.toString(16).padStart(2, '0')}`;
  }).join('');
}

export function decodeFromAscii(asciiStr) {
  return asciiStr.replace(/\\x[\dA-Fa-f]{2}/g, match => {
    return String.fromCharCode(parseInt(match.replace('\\x', ''), 16));
  });
} export class Unicode extends plugin {
  constructor() {
    super({
      name: 'unicode',
      dsc: 'unicode',
      event: 'message',
      priority: 6,
      rule: [
        {
          reg: '^#?unicode编码\\s*(.+)',
          fnc: 'encodeToUnicodeHandler'
        },
        {
          reg: '^#?unicode解码\\s*(.+)',
          fnc: 'decodeFromUnicodeHandler'
        },
        {
          reg: '^#?ascii编码\\s*(.+)',
          fnc: 'encodeToAsciiHandler'
        },
        {
          reg: '^#?ascii解码\\s*(.+)',
          fnc: 'decodeFromAsciiHandler'
        }
      ]
    });
  }

  async encodeToUnicodeHandler(e) {
    let msg = e.msg.match(/#?unicode编码\s*(.+)/)[1].trim();
    const encodedMsg = encodeToUnicode(msg);
    try {
      await e.reply(`编码结果: ${encodedMsg}`);
    } catch (error) {
      await e.reply(`Error: ${error.message}`);
    }
  }

  async decodeFromUnicodeHandler(e) {
    let msg = e.msg.match(/#?unicode解码\s*(.+)/)[1].trim();
    const decodedMsg = decodeFromUnicode(msg);
    try {
      await e.reply(`解码结果: ${decodedMsg}`);
    } catch (error) {
      await e.reply(`Error: ${error.message}`);
    }
  }

  async encodeToAsciiHandler(e) {
    let msg = e.msg.match(/#?ascii编码\s*(.+)/)[1].trim();
    const encodedMsg = encodeToAscii(msg);
    try {
      await e.reply(`编码结果: ${encodedMsg}`);
    } catch (error) {
      await e.reply(`Error: ${error.message}`);
    }
  }

  async decodeFromAsciiHandler(e) {
    let msg = e.msg.match(/#?ascii解码\s*(.+)/)[1].trim();
    const decodedMsg = decodeFromAscii(msg);
    try {
      await e.reply(`解码结果: ${decodedMsg}`);
    } catch (error) {
      await e.reply(`Error: ${error.message}`);
    }
  }
}

