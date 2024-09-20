import { createRequire } from 'module';
import _ from 'lodash';
import common from '../../../lib/common/common.js';
import { Restart } from '../../other/restart.js';

const require = createRequire(import.meta.url);
const { exec, execSync } = require('child_process');

let uping = false;

export class Update extends plugin {
    constructor() {
        super({
            name: 'MEMZ插件',
            dsc: '更新插件',
            event: 'message',
            priority: -90,
            rule: [
                {
                    reg: /^#*(memz)(插件)?(强制)?更新$/i,
                    fnc: 'update'
                },
                {
                    reg: /^#*(memz)(插件)?更新日志$/i,
                    fnc: 'uplog'
                }
            ]
        });
    }

    async update() {
        if (!this.e.isMaster) return true;
        if (uping) {
            await this.reply('已有命令更新中..请勿重复操作');
            return;
        }
        if (!(await this.checkGit())) return;

        const isForce = this.e.msg.includes('强制');
        await this.runUpdate(isForce);

        if (this.isUp) {
            setTimeout(() => this.restart(), 2000);
        }
    }

    restart() {
        new Restart(this.e).restart();
    }

    async runUpdate(isForce) {
        const _path = './plugins/memz-plugin/';
        let command = `git -C ${_path} pull --no-rebase`;
        if (isForce) {
            command = `git -C ${_path} reset --hard origin && ${command}`;
            await this.reply('正在执行强制更新操作，请稍等');
        } else {
            await this.reply('正在执行更新操作，请稍等');
        }

        this.oldCommitId = await this.getCommitId('memz-plugin');
        uping = true;
        const ret = await this.execCommand(command);
        uping = false;

        if (ret.error) {
            this.logError(ret.error, ret.stdout);
            return false;
        }

        const time = await this.getTime('memz-plugin');
        if (/(Already up[ -]to[ -]date|已经是最新的)/.test(ret.stdout)) {
            await this.reply(`MEMZ插件已经是最新版本\n最后更新时间：${time}`);
        } else {
            await this.reply(`MEMZ插件\n最后更新时间：${time}`);
            this.isUp = true;
            const log = await this.getLog('memz-plugin');
            await this.reply(log);
        }
        return true;
    }

    async getLog(plugin = 'memz-plugin') {
        let cm = `cd ./plugins/${plugin}/ && git log  -20 --oneline --pretty=format:"%h||[%cd]  %s" --date=format:"%F %T"`
        let logAll;
        try {
            logAll = execSync(cm, { encoding: 'utf-8' });
        } catch (error) {
            this.logError(error.toString());
            return false;
        }
        if (!logAll) return false;

        const log = logAll.split('\n')
            .filter(line => !line.includes('Merge branch'))
            .map(line => line.split('||')[1])
            .join('\n\n');

        if (!log) return '';

        const end = '更多详细信息，请前往gitee查看\nhttps://gitee.com/memzjs/memz-plugin';
        return await common.makeForwardMsg(this.e, [log, end], `${plugin}更新日志，共${log.split('\n\n').length}条`);
    }

    async uplog() {
        const log = await this.getLog();
        await this.reply(log);
    }

    async getCommitId(plugin = '') {
        const cm = `git -C ./plugins/${plugin}/ rev-parse --short HEAD`;
        let commitId = execSync(cm, { encoding: 'utf-8' });
        return _.trim(commitId);
    }

    async getTime(plugin = '') {
        const cm = `cd ./plugins/${plugin}/ && git log -1 --pretty=format:"%cd" --date=format:"%m-%d %H:%M"`;
        let time;
        try {
            time = execSync(cm, { encoding: 'utf-8' });
        } catch (error) {
            this.logError(error.toString());
            time = '获取时间失败';
        }
        return _.trim(time);
    }

    async execCommand(cmd) {
        return new Promise(resolve => {
            exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
                resolve({ error, stdout, stderr });
            });
        });
    }

    async checkGit() {
        const ret = execSync('git --version', { encoding: 'utf-8' });
        if (!ret || !ret.includes('git version')) {
            await this.reply('请先安装git');
            return false;
        }
        return true;
    }

    logError(error, stdout) {
        const msg = '更新失败！';
        const errMsg = error.toString();
        const stdoutMsg = stdout.toString();
        if (errMsg.includes('Timed out')) {
            const remote = errMsg.match(/'(.+?)'/)[0].replace(/'/g, '');
            this.reply(`${msg}\n连接超时：${remote}`);
        } else if (/Failed to connect|unable to access/.test(errMsg)) {
            const remote = errMsg.match(/'(.+?)'/)[0].replace(/'/g, '');
            this.reply(`${msg}\n连接失败：${remote}`);
        } else if (errMsg.includes('be overwritten by merge')) {
            this.reply(`${msg}存在冲突：\n${errMsg}\n请解决冲突后再更新，或者执行#MEMZ强制更新，放弃本地修改`);
        } else if (stdoutMsg.includes('CONFLICT')) {
            this.reply([`${msg}存在冲突\n`, errMsg, stdoutMsg, '\n请解决冲突后再更新，或者执行#MEMZ强制更新，放弃本地修改']);
        } else {
            this.reply([errMsg, stdoutMsg]);
        }
    }
}
