import { Config } from "../components/index.js";


export function encodeToUnicode(msg) {
  return msg
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0).toString(16).padStart(4, "0");
      return `\\u${code}`;
    })
    .join("");
}

export function decodeFromUnicode(unicodeStr) {
  return unicodeStr.replace(/\\u[\dA-Fa-f]{4}/g, (match) =>
    String.fromCharCode(parseInt(match.replace("\\u", ""), 16)),
  );
}

export function encodeToAscii(msg) {
  return msg
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      return `\\x${code.toString(16).padStart(2, "0")}`;
    })
    .join("");
}

export function decodeFromAscii(asciiStr) {
  return asciiStr.replace(/\\x[\dA-Fa-f]{2}/g, (match) =>
    String.fromCharCode(parseInt(match.replace("\\x", ""), 16)),
  );
}

export class Unicode extends plugin {
  constructor() {
    super({
      name: "unicode",
      dsc: "unicode",
      event: "message",
      priority: 6,
      rule: [
        {
          reg: /^(#?)(unicode|ascii)(编码|解码)\s*(.+)/,
          fnc: "handleEncodingDecoding",
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
      if (operation === "unicode") {
        result =
          action === "编码" ? encodeToUnicode(input) : decodeFromUnicode(input);
      } else if (operation === "ascii") {
        result =
          action === "编码" ? encodeToAscii(input) : decodeFromAscii(input);
      }

      await e.reply(`结果:${result}`, true);
    } catch (error) {
      await e.reply(`Error: ${error.message}`);
    }
  }

  async handleEncodingDecoding(e) {
    const { UnicodeAll } = Config.getConfig("memz");
    if (!UnicodeAll && !e.isMaster)
      return logger.warn("[memz-plugin]Unicode功能当前为仅主人可用");
    await this.handleReply(e, {
      reg: /^(#?)(unicode|ascii)(编码|解码)\s*(.+)/,
      fn: this.handleReply,
    });
  }
}
