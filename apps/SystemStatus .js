import os from 'os';
import { execSync } from 'child_process';

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
                },
                {
                    reg: /^#?(MEMZ)(插件)?系统状态pro/i,
                    fnc: 'getExtendedSystemInfo'
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

    async getExtendedSystemInfo(e) {
        if (!e.isMaster) return await e.reply('就凭你也配');

        try {
            const stats = this.getSystemStats();
            const additionalInfo = this.getAdditionalSystemInfo();

            const message = `--------系统状态--------
操作系统: ${stats.osType}
系统架构: ${stats.arch}
主机名: ${stats.hostname}
总内存: ${stats.totalMem} MB
空闲内存: ${stats.freeMem} MB
已用内存: ${stats.usedMem} MB
系统运行时间: ${stats.uptime} 天
CPU 数量: ${stats.cpuCount}
CPU 负载: ${stats.cpuLoad}
磁盘总量: ${additionalInfo.diskTotal} GB
磁盘可用量: ${additionalInfo.diskFree} GB
磁盘已用量: ${additionalInfo.diskUsed} GB
网络接口信息: ${additionalInfo.networkInterfaces}
系统温度: ${additionalInfo.systemTemperature} °C
`;

            await e.reply(message);
        } catch (error) {
            await e.reply(`Error fetching extended system info: ${error.message}`);
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

    getAdditionalSystemInfo() {
        const diskTotal = (execSync('df -h --total | grep total | awk \'{print $2}\'').toString().trim() || 'N/A');
        const diskFree = (execSync('df -h --total | grep total | awk \'{print $4}\'').toString().trim() || 'N/A');
        const diskUsed = (execSync('df -h --total | grep total | awk \'{print $3}\'').toString().trim() || 'N/A');

        const networkInterfaces = Object.entries(os.networkInterfaces())
            .map(([name, infos]) => `${name}: ${infos.map(info => info.address).join(', ')}`)
            .join('; ');

        let systemTemperature;
        try {
            systemTemperature = execSync('sensors | grep -i "core 0" | awk \'{print $3}\'').toString().trim();
        } catch {
            systemTemperature = 'N/A';
        }

        return {
            diskTotal,
            diskFree,
            diskUsed,
            networkInterfaces,
            systemTemperature
        };
    }
}
