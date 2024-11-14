export const cfgSchema = {
    memz: {
        title: '插件设置',
        cfg: {
            SystemStatusAll: {
                title: '系统状态',
                key: '系统状态',
                def: false,
                desc: '系统状态是否所有人可用',
                fileName: 'memz'
            },
            RedisStatusAll: {
                title: 'Redis状态',
                key: 'Redis状态',
                def: false,
                desc: 'Redis状态是否所有人可用',
                fileName: 'memz'
            }
        },
    },
    tools: {
        title: '工具设置',
        cfg: {
            WhoisAll: {
                title: 'whois',
                key: 'Whois',
                def: false,
                desc: '是否所有人可用Whois',
                fileName: 'memz'
            },
            SeoAll: {
                title: 'seo',
                key: 'SEO',
                def: false,
                desc: 'SEO是否所有人可用',
                fileName: 'memz'
            },
            PingAll: {
                title: 'ping',
                key: 'ping',
                def: false,
                desc: 'Ping是否所有人可用',
                fileName: 'memz'
            },
            UnicodeAll: {
                title: 'unicode',
                key: 'unicode',
                def: false,
                desc: 'UnicodeAll是否所有人可用',
                fileName: 'memz'
            },
            UrlAll: {
                title: 'url',
                key: 'url',
                def: false,
                desc: 'url编码|解码是否所有人可用',
                fileName: 'memz'
            },
            BaseConversionAll: {
                title: '进制转换',
                key: '进制转换',
                def: false,
                desc: '进制转换是否所有人可用',
                fileName: 'memz'
            }
        },
    },
    search: {
        title: '网络搜索设置',
        cfg: {
            search_movie: {
                title: '搜影视',
                key: '搜影视',
                def: false,
                desc: '搜影视是否所有人可用',
                fileName: 'memz'
            },
            search_resource: {
                title: '搜资源',
                key: '搜资源',
                def: false,
                desc: '搜资源是否所有人可用',
                fileName: 'memz'
            },
            search_magnet: {
                title: '磁力搜索',
                key: '磁力搜索',
                def: false,
                desc: '磁力搜索是否所有人可用',
                fileName: 'memz'
            }
        },
    },
    update: {
        title: '自动更新设置',
        cfg: {
            autoupdate: {
                title: '自动更新',
                key: '自动更新',
                def: false,
                desc: '是否自动更新插件',
                fileName: 'update'
            },
            checkupdate: {
                title: '自动检查更新',
                key: '自动检查更新',
                def: false,
                desc: '是否自动检查插件更新',
                fileName: 'update'
            }
        }
    }
}
