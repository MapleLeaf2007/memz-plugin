import { Config } from "../components/index.js";
async function convertBase(number, fromBase, toBase) {
  if (fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) {
    throw new Error("Base must be in the range 2-36");
  }
  const base10Number = parseInt(number, fromBase);
  if (isNaN(base10Number)) {
    throw new Error(`Invalid number "${number}" for base ${fromBase}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  return base10Number.toString(toBase).toUpperCase();
}
export class TextMsg extends plugin {
  constructor() {
    super({
      name: "进制转换",
      dsc: "进制转换",
      event: "message",
      priority: 6,
      rule: [
        {
          reg: "^#?进制转换\\s*(.+)",
          fnc: "BaseConversion",
        },
      ],
    });
  }

  async BaseConversion(e) {
    const { BaseConversionAll } = Config.getConfig("memz");
    if (!BaseConversionAll && !e.isMaster)
      return logger.warn("[memz-plugin]进制转换状态当前为仅主人可用");
    let args = e.msg
      .match(/#?进制转换\s*(.+)/)[1]
      .trim()
      .split(/\s+/);

    if (args.length !== 3) {
      await e.reply("需要输入 <原始数> <起始进制> <目标进制>");
      return;
    }

    const [number, fromBase, toBase] = args;

    try {
      const convertedNumber = await convertBase(
        number,
        parseInt(fromBase, 10),
        parseInt(toBase, 10),
      );
      await e.reply(
        `原始数 ${number} 起始进制 ${fromBase} 目标进制 ${toBase} 是 ${convertedNumber}`,
      );
    } catch (error) {
      await e.reply(`Error: ${error.message}`);
    }
  }
}
