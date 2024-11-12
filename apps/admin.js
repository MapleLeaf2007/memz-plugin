import { Config, Render } from "../components/index.js";

const CfgReg = /^#memz设置\s*([^\s]+)\s*(开启|关闭|添加仓库|删除仓库)?\s*(.*)$/i;

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
    "更新检查": "update.checkupdate",
    "添加仓库": "update.CUSTOM_REPOSITORY.add",
    "删除仓库": "update.CUSTOM_REPOSITORY.remove"
};

function addRepository(url) {
    let config = Config.getConfig("update") || {};
    if (!config.CUSTOM_REPOSITORY) config.CUSTOM_REPOSITORY = [];
    if (!config.CUSTOM_REPOSITORY.includes(url)) {
        config.CUSTOM_REPOSITORY.push(url);
        Config.save("config", "update", config);
    }
}

function removeRepository(url) {
    let config = Config.getConfig("update") || {};
    config.CUSTOM_REPOSITORY = (config.CUSTOM_REPOSITORY || []).filter(repo => repo !== url);
    Config.save("config", "update", config);
}

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
    let reg = CfgReg.exec(e.msg);
    if (reg && reg[1]) {
        let option = reg[1];
        let action = reg[2] || "";
        let value = reg[3] || "";

        let cfgKey = cfgMap[option];

        if (action === "开启" || action === "关闭") {
            let boolValue = action === "开启";
            if (cfgKey) {
                setCfg(cfgKey, boolValue);
            }
        }
        else if (action === "添加仓库" && value) {
            addRepository(value);
        }
        else if (action === "删除仓库" && value) {
            removeRepository(value);
        }
    }

    let cfg = {};
    for (let name in cfgMap) {
        let key = cfgMap[name];
        cfg[key] = await getStatus(key);
    }
    return await Render.render("admin/index", {
        ...cfg
    }, { e, scale: 1.2 });
}

// 设置配置项
function setCfg(rote, value, def = false) {
    let arr = rote?.split(".") || [];
    if (arr.length > 1) {
        let type = arr[0];
        let name = arr[1];
        let data = Config.getYaml("config", type, def ? "defSet" : "config") || {};
        data[name] = value;
        Config.save("config", type, def ? "defSet" : "config", data);
    }
}
async function getStatus(rote, def = false) {
    let _class = "cfg-status";
    let value = "";
    let arr = rote?.split(".") || [];

    if (arr.length > 1) {
        let type = arr[0];
        let name = arr[1];
        logger.warn(`type: ${type}, name: ${name}`);
        let data = Config.getConfig(type) || {};
        logger.warn(`data: ${JSON.stringify(data)}`);

        if (data && data[name] !== undefined) {
            if (data[name] === true || data[name] === false) {
                _class = data[name] === false ? `${_class} status-off` : _class;
                value = data[name] === true ? "已开启" : "已关闭";
            } else if (Array.isArray(data[name]) && rote.includes("CUSTOM_REPOSITORY")) {
                value = data[name].length > 0 ? "已添加仓库" : "无仓库";
                _class = `${_class} status-off`;
            } else {
                value = data[name] || "未设置";
            }
        } else {
            value = "未设置";
        }
    }

    if (!value) {
        if (rote === "mz.botname") {
            value = "";
            logger.warn(`value: ${value}`);
        } else {
            _class = `${_class} status-off`;
            value = "已关闭";
            logger.warn(`value: ${value}`);
        }
    }

    logger.warn(`<div class="${_class}">${value}</div>`);
    return `<div class="${_class}">${value}</div>`;
}