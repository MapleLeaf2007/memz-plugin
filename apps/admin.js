import { Config, Render } from "../components/index.js";

const CfgReg = /^#memz设置\s*([^\s]+)\s*(开启|关闭)?\s*(.*)$/i;

const cfgMap = {
    "系统状态": "memz.SystemStatusAll",
    "Redis状态": "memz.RedisStatusAll",
    "Whois": "memz.WhoisAll",
    "SEO": "memz.SeoAll",
    "Ping": "memz.PingAll",
    "Unicode编码解码": "memz.UnicodeAll",
    "url编码解码": "memz.UrlAll",
    "进制转换": "memz.BaseConversionAll",
    "搜影视": "memz.search_movie",
    "搜资源": "memz.search_resource",
    "申请游戏": "memz.apply_game",
    "磁力搜索": "memz.search_magnet",
    "自动更新": "update.autoupdate",
    "更新检查": "update.checkupdate"
};

export class memz_admin extends plugin {
    constructor() {
        super({
            name: "MEMZ插件设置",
            dsc: "MEMZ插件设置",
            event: "message",
            priority: 2000,
            rule: [
                {
                    reg: CfgReg,
                    fnc: "admin",
                    permission: "master"
                }
            ]
        })
    }

    async admin(e) {
        return await set(e);
    }
}

async function set(e) {
    // let reg = CfgReg.exec(e.msg);
    // if (reg && reg[1]) {
    //     let option = reg[1];
    //     let action = reg[2] || "";

    //     let cfgKey = cfgMap[option];

    //     if (action === "开启" || action === "关闭") {
    //         let boolValue = action === "开启";
    //         if (cfgKey) {
    //             setCfg(cfgKey, boolValue);
    //         }
    //     }
    // }

    let cfg = {};
    for (let name in cfgMap) {
        let key = cfgMap[name];
        cfg[key] = await getStatus(key);
    }
    logger.warn(`cfg: ${JSON.stringify(cfg)}`);
    return await Render.render("admin/index", { ...cfg }, { e, scale: 1.6 });
}

// 设置配置项
function setCfg(rote, value) {
    let arr = rote?.split(".") || [];
    if (arr.length > 1) {
        let type = arr[0];
        let name = arr[1];
        let data = Config.getConfig(type) || {};
        data[name] = value;
        Config.save(type, "config", data);
    }
}

async function getStatus(rote) {
    let _class = "cfg-status";
    let value = "";
    let arr = rote?.split(".") || [];

    if (arr.length > 1) {
        let type = arr[0];
        let name = arr[1];

        // 获取配置并确保其为对象
        let data = Config.getConfig(type);
        logger.warn(`获取到的数据: ${JSON.stringify(data)}`);

        if (data && data[name] !== undefined) {
            logger.warn(`data[${name}]: ${data[name]}`);
            // 其他处理逻辑...
        } else {
            logger.warn(`未找到配置项: ${name}`);
        }

        if (data) {
            if (data[name] !== undefined) {
                if (data[name] === true) {
                    _class = _class;
                    value = "已开启";
                } else if (data[name] === false) {
                    _class = `${_class} status-off`;
                    value = "已关闭";
                } else {
                    value = data[name] || "未设置";
                }
            } else {
                value = "未设置";
                _class = `${_class} status-off`;
            }
        } else {
            logger.warn(`未找到配置文件: ${type}`);
            _class = `${_class} status-off`;
            value = "已关闭";
        }
    } else {
        _class = `${_class} status-off`;
        value = "已关闭";
    }

    return `<div class="${_class}">${value}</div>`;
}
