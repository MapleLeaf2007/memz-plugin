import { Config, Render, Version } from '../components/index.js'
import lodash from 'lodash'


let keys = lodash.map(Config.getCfgSchemaMap(), (i) => i.key)
let sysCfgReg = new RegExp(`^#memz设置\\s*(${keys.join('|')})?\\s*(.*)$`)

export class setting extends plugin {
    constructor() {
        super({
            name: '[memz-plugin] 设置',
            dsc: '[memz-plugin] 设置',
            event: 'message',
            priority: 1,
            rule: [
                {
                    reg: sysCfgReg,
                    fnc: 'setting',
                    permission: 'master'
                }
            ]
        })
    }
    async setting(e) {
        let cfgReg = sysCfgReg
        let regRet = cfgReg.exec(e.msg)
        let cfgSchemaMap = Config.getCfgSchemaMap()
        if (!regRet) {
            return true
        }

        if (regRet[1]) {
            // 设置模式
            let val = regRet[2] || ''

            let cfgSchema = cfgSchemaMap[regRet[1]]
            if (cfgSchema.input) {
                val = cfgSchema.input(val)
            } else {
                val = cfgSchema.type === 'num' ? (val * 1 || cfgSchema.def) : !/关闭/.test(val)
            }
            Config.modify(cfgSchema.fileName, cfgSchema.cfgKey, val)
        }

        let schema = Config.getCfgSchema()
        let cfg = Config.getCfg()
        logger.debug('[memz-plugin]schema：', schema)
        logger.debug('[memz-plugin]cfg：', cfg)

        // 渲染图像
        return await Render.render('admin/index', {
            schema,
            cfg,
            isMiao: Version.isMiao
        }, { e, scale: 1.4 })
    }
}
