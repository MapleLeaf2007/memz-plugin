import os from 'os';

export class SystemStatus extends plugin {
    constructor() {
        super({
            name: '系统状态',
            dsc: '系统状态',
            event: 'message',
            priority: 6,
            rule: [
                {
                    reg: /^#?(memz)(插件)?系统状态/i,
                    fnc: 'getSystemInfo'
                }
            ]
        });
    }

    async getSystemInfo(e) {
        if (!e.isMaster) return await e.reply('就凭你也配');

        try {
            const stats = this.getSystemStats();

            const message = `--------系统状态--------
操作系统: ${stats.osType}
系统架构: ${stats.arch}
主机名: ${stats.hostname}
总内存: ${stats.totalMem} MB
空闲内存: ${stats.freeMem} MB
已用内存: ${stats.usedMem} MB
系统运行时间: ${stats.uptime} 天
CPU 数量: ${stats.cpuCount}
CPU 负载: ${stats.cpuLoad}`;

            await e.reply(message);
        } catch (error) {
            await e.reply(`Error fetching system info: ${error.message}`);
        }
    }

    getSystemStats() {
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
        const freeMem = (os.freemem() / 1024 / 1024).toFixed(2);
        const usedMem = (totalMem - freeMem).toFixed(2);
        const uptime = (os.uptime() / 86400).toFixed(2);
        const cpuLoad = os.loadavg()[0].toFixed(2);
        const cpus = os.cpus();

        return {
            osType: os.type(),
            arch: os.arch(),
            hostname: os.hostname(),
            totalMem,
            freeMem,
            usedMem,
            uptime,
            cpuCount: cpus.length,
            cpuLoad
        };
    }
}
