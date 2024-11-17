//import { Config } from "../components/index.js";
//const { api } = Config.getConfig("memz");
let 早安接口 = 'https://api.mhimg.cn/api/txt_zaoan?type=json'
export class MEMZ_API extends plugin {
    constructor() {
        super({
            name: "MEMZ_API",
            dsc: "MEMZ_API集合",
            event: "message",
            priority: 9,
            rule: [
                {
                    reg: "^#?(早安|早上好|早啊|早|早安问候|早安问候语录|早安问候语录)(语录)?",
                    fnc: "早安",
                }
            ],
        });
    }


    async 早安(e) {
        try {
            const 響應 = await fetch(早安接口);
            if (!響應.ok) {
                throw new Error(`HTTP error! status: ${響應.status}`);
            }
            const data = await 響應.json();
            e.reply(data.msg, true);
        } catch (錯誤) {
            e.reply(`抱歉，获取早安语录失败，请稍后再试！\n错误信息：${錯我}`, true);
            logger.error('Failed to fetch good morning quote:', 錯誤);
        }
    }
}