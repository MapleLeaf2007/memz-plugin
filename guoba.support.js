import lodash from "lodash";
import { Config } from "./components/index.js";

export function supportGuoba() {
  return {
    pluginInfo: {
      name: "memz-plugin",
      title: "memz-plugin",
      author: "@MEMZJS",
      authorLink: "https://gitee.com/memzjs",
      link: "https://gitee.com/memzjs/memz-plugin",
      isV3: true,
      isV2: false,
      description: "Yunzai系列Bot插件",
      icon: "mdi:stove",
      iconColor: "rgb(241,212,152)",
    },
    configInfo: {
      schemas: [
        {
          component: "Divider",
          label: "插件设置"
        },
        {
          field: "memz.autoupdate",
          label: "插件自动更新",
          bottomHelpMessage: "插件更新时自动更新插件",
          bottomHelpMessage: "",
          component: "Switch"
        },
        {
          field: "memz.checkupdate",
          label: "自动检查插件更新",
          bottomHelpMessage: "检查插件更新并推送到主人",
          component: "Switch"
        },
        {
          field: "memz.SystemStatusAll",
          label: "系统状态所有人可用",
          bottomHelpMessage: "关闭时仅主人可用",
          component: "Switch",
        },
        {
          field: "memz.RedisStatusAll",
          label: "Redis状态所有人可用",
          bottomHelpMessage: "关闭时仅主人可用",
          component: "Switch",
        },
        {
          component: "Divider",
          label: "工具设置"
        },
        {
          field: "memz.WhoisAll",
          label: "Whois功能所有人可用",
          bottomHelpMessage: "关闭时仅主人可用",
          component: "Switch"
        },
        {
          field: "memz.SeoAll",
          label: "SEO所有人可用",
          bottomHelpMessage: "关闭时仅主人可用",
          component: "Switch"
        },
        {
          field: "memz.PingAll",
          label: "Ping功能所有人可用",
          bottomHelpMessage: "关闭时仅主人可用",
          component: "Switch"
        },
        {
          field: "memz.UnicodeAll",
          label: "Unicode功能所有人可用",
          bottomHelpMessage: "关闭时仅主人可用",
          component: "Switch"
        },
        {
          field: "memz.UrlAll",
          label: "Url功能所有人可用",
          bottomHelpMessage: "关闭时仅主人可用",
          component: "Switch"
        },
        {
          field: "memz.BaseConversionAll",
          label: "进制转换功能所有人可用",
          bottomHelpMessage: "关闭时仅主人可用",
          component: "Switch"
        },
        {
          component: "Divider",
          label: "网络搜索设置"
        },
        {
          field: "memz.search_movie",
          label: "是否开启搜影视",
          bottomHelpMessage: "关闭时所有人不可用",
          component: "Switch"
        },
        {
          field: "memz.search_resource",
          label: "是否开启搜资源",
          bottomHelpMessage: "关闭时所有人不可用",
          component: "Switch"
        },
        {
          field: "memz.apply_game",
          label: "是否开启申请游戏",
          bottomHelpMessage: "关闭时所有人不可用",
          component: "Switch"
        }
      ],
      getConfigData() {
        return {
          memz: Config.getDefOrConfig("memz-config"),
        };
      },
      setConfigData(data, { Result }) {
        let config = Config.getCfg();

        for (const key in data) {
          let split = key.split(".");
          if (lodash.isEqual(config[split[1]], data[key])) continue;
          Config.modify(split[0] + "-config", split[1], data[key]);
        }
        return Result.ok({}, "𝑪𝒊𝒂𝒍𝒍𝒐～(∠・ω< )⌒★");
      },
    },
  };
}
