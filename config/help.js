export const helpCfg = {
  themeSet: false,
  title: "MEMZ-Plugin-HelpList",
  subTitle: "Yunzai-Bot & MEMZ-Plugin",
  colWidth: 265,
  theme: "all",
  themeExclude: ["default"],
  colCount: 3,
  bgBlur: true,
};
export const helpList = [
  {
    group: "WebTools",
    list: [
      {
        icon: 80,
        title: "#whois+域名",
        desc: "查询域名信息",
      },
      {
        icon: 82,
        title: "#(tc)?ping+域名",
        desc: "(TC)Ping网站",
      },
      {
        icon: 83,
        title: "#seo+域名",
        desc: "查询域名的SEO信息",
      },
    ],
  },
  {
    group: "加解码功能",
    list: [
      {
        icon: 67,
        title: "#url(编码|解码)+内容",
        desc: "URL编码,解码",
      },
      {
        icon: 68,
        title: "#ascii(编码|解码)+内容",
        desc: "ascii(解|编)码",
      },
      {
        icon: 69,
        title: "#unicode(编码|解码)+内容",
        desc: "unicode(解|编)码",
      },
      {
        icon: 70,
        title: "#punycode(编码|解码)+内容",
        desc: "punycode(解|编)码",
      },
      {
        icon: 81,
        title: "#摩尔斯(编|解)码",
        desc: "摩尔斯(编|解)码,仅支持英文",
      },
      {
        icon: 71,
        title: "#进制转换",
        desc: "没有什么用的进制转换",
      },
    ],
  },
  {
    group: "搜索功能",
    list: [
      {
        icon: 40,
        title: "#搜资源+名称",
        desc: "搜索游戏资源",
      },
      {
        icon: 56,
        title: "#搜影视+名称",
        desc: "搜索影视资源",
      },
    ],
  },
  {
    group: "MEMZ管理",
    auth: "master",
    list: [
      {
        icon: 58,
        title: "#MEMZ(强制)更新",
        desc: "(强制)更新MEMZ插件",
      },
      {
        icon: 59,
        title: "#MEMZ更新日志",
        desc: "查看MEMZ插件更新日志",
      },
      {
        icon: 40,
        title: "#Redis状态(pro)(文本)",
        desc: "(文本|图片)查看Redis状态",
      },
      {
        icon: 48,
        title: "#(memz)系统状态(pro)(max)",
        desc: "查看系统状态",
      },
    ],
  },
];