import lodash from 'lodash'
import { Config } from './components/index.js'
export function supportGuoba() {
    let groupList = Array.from(Bot.gl.values())
    groupList = groupList.map(item => item = { label: `${item.group_name}-${item.group_id}`, value: item.group_id })
    return {
        pluginInfo: {
            name: 'memz-plugin',
            title: 'memz-plugin',
            author: '@MEMZJS',
            authorLink: 'https://gitee.com/memzjs',
            link: 'https://gitee.com/memzjs/memz-plugin',
            isV3: true,
            isV2: false,
            description: 'Yunzai系列Bot插件',
            icon: 'mdi:stove',
            iconColor: 'rgb(241,212,152)',
        },
        configInfo: {
            schemas: [],
            /**
             * 获取配置数据
             * @returns {Object} - 返回包含redis和memz配置数据的对象
             */
            getConfigData() {
                return {
                    memz: Config.getDefOrConfig('memz-config'),
                }
            },
            /**
             * 设置配置数据
             * @param {Object} data - 要设置的数据对象
             * @param {Object} Result - 结果对象
             * @returns {Object} - 返回保存成功的结果对象
             */
            setConfigData(data, { Result }) {
                let config = Config.getCfg()

                for (const key in data) {
                    let split = key.split('.')
                    if (lodash.isEqual(config[split[1]], data[key])) continue
                    Config.modify(split[0] + '-config', split[1], data[key])
                }
                return Result.ok({}, '保存成功~')
            },
        },
    }
}
