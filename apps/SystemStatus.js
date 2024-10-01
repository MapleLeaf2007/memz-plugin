import os from 'os';

import si from 'systeminformation';

export class SystemStatus extends plugin {
    constructor() {
        super({
            name: '系统状态',
            dsc: '系统状态',
            event: 'message',
            priority: 6,
            rule: [
                { reg: /^#(memz)?(插件)?系统状态pro/i, fnc: 'getExtendedSystemInfo' },
                { reg: /^#(memz)?(插件)?系统状态$/i, fnc: 'getSystemInfo' }
            ]
        });
    }

    async getSystemInfo(e) {
        if (!e.isMaster) return await e.reply('就凭你也配?', true);
        try {
            await e.reply(this.basicInfo());
        } catch (error) {
            await e.reply(`Error fetching system info: ${error.message}`);
        }
    }

    async getExtendedSystemInfo(e) {
        if (!e.isMaster) return await e.reply('就凭你也配?', true);
        try {
            const additionalInfo = await this.getAdditionalSystemInfo();
            const message = `${this.basicInfo()}\n${additionalInfo}`;
            await e.reply(message);
        } catch (error) {
            await e.reply(`Error fetching extended system info: ${error.message}`);
        }
    }

    basicInfo() {
        const stats = this.getSystemStats();
        return `---------系统状态---------
操作系统: ${stats.osType}
系统架构: ${stats.arch}
主机名: ${stats.hostname}
总内存: ${stats.totalMem} MB
空闲内存: ${stats.freeMem} MB
已用内存: ${stats.usedMem} MB
系统运行时间: ${stats.uptime} 天
CPU 数量: ${stats.cpuCount}
CPU 负载: ${stats.cpuLoad}`;
    }

    getSystemStats() {
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
        const freeMem = (os.freemem() / 1024 / 1024).toFixed(2);
        const usedMem = (totalMem - freeMem).toFixed(2);
        const uptime = (os.uptime() / 86400).toFixed(2);
        const cpuLoad = os.loadavg()[0].toFixed(2);
        return {
            osType: os.type(),
            arch: os.arch(),
            hostname: os.hostname(),
            totalMem,
            freeMem,
            usedMem,
            uptime,
            cpuCount: os.cpus().length,
            cpuLoad
        };
    }

    async getAdditionalSystemInfo() {
        const diskInfo = await si.fsSize(); // 获取磁盘信息
        const cpuTemperature = await si.cpuTemperature(); // 获取 CPU 温度
        const networkStats = await si.networkStats(); // 获取网络流量信息
        const loadAvg = os.loadavg().map(val => val.toFixed(2)).join(' ');
        const users = await si.users(); // 获取登录用户
        const services = await si.services(['ssh', 'httpd']); // 获取服务状态

        const diskTotal = (diskInfo[0]?.size / 1024 / 1024 / 1024).toFixed(2) + ' GB';
        const diskFree = (diskInfo[0]?.available / 1024 / 1024 / 1024).toFixed(2) + ' GB';
        const diskUsed = (diskInfo[0]?.used / 1024 / 1024 / 1024).toFixed(2) + ' GB';
        const systemTemperature = cpuTemperature.main ? `${cpuTemperature.main} °C` : 'N/A';
        const networkBandwidth = networkStats.map(stat => `Interface: ${stat.iface}, In: ${stat.rx_bytes} bytes, Out: ${stat.tx_bytes} bytes`).join('\n');
        const loggedInUsers = users.map(user => user.user).join(', ') || 'N/A';
        const serviceStatus = services.map(service => `${service.name}: ${service.running ? 'Active' : 'Inactive'}`).join(', ');

        return `磁盘总量: ${diskTotal}
磁盘可用量: ${diskFree}
磁盘已用量: ${diskUsed}
系统温度: ${systemTemperature}
网络使用情况: ${networkBandwidth}
系统负载平均值: ${loadAvg}
登录用户: ${loggedInUsers}
服务状态: ${serviceStatus}`;
    }
}
