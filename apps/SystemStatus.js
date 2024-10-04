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

    async handleMasterCheck(e) {
        if (!e.isMaster) {
            await e.reply('就凭你也配?', true);
            return false;
        }
        return true;
    }

    async getSystemInfo(e) {
        if (!(await this.handleMasterCheck(e))) return;
        try {
            const info = await this.basicInfo(e);
            await e.reply(info);
        } catch (error) {
            await e.reply(`获取系统信息时出错: ${error.message}`);
        }
    }

    async getExtendedSystemInfo(e) {
        if (!(await this.handleMasterCheck(e))) return;
        try {
            const [basicInfo, additionalInfo] = await Promise.all([
                this.basicInfo(e),
                this.getAdditionalSystemInfo()
            ]);
            await e.reply(`${basicInfo}\n${additionalInfo}`);
        } catch (error) {
            await e.reply(`获取扩展系统信息时出错: ${error.message}`);
        }
    }

    async basicInfo(e) {
        try {
            const [
                osInfo, cpuInfo, currentLoad, memoryInfo
            ] = await Promise.all([
                si.osInfo(), si.cpu(), si.currentLoad(), si.mem()
            ]);

            const systemArchitecture = `${osInfo.distro} ${osInfo.release} ${osInfo.arch}`;
            const cpuUsage = currentLoad.currentLoad.toFixed(2) + '%';
            const cpuSpeed = cpuInfo.speed ? `${cpuInfo.speed} GHz` : 'N/A';
            const cpuDetails = `${cpuInfo.physicalCores}核 ${cpuInfo.brand}`;
            const usedMemoryGiB = (memoryInfo.active / 1024 / 1024 / 1024).toFixed(2);
            const totalMemoryGiB = (memoryInfo.total / 1024 / 1024 / 1024).toFixed(2);
            const memoryUsagePercent = ((memoryInfo.active / memoryInfo.total) * 100).toFixed(2) + '%';
            const memoryUsage = `${usedMemoryGiB} GiB / ${totalMemoryGiB} GiB (${memoryUsagePercent})`;

            const swapUsage = memoryInfo.swaptotal > 0 ?
                `${((memoryInfo.swaptotal - memoryInfo.swapfree) / 1024 / 1024 / 1024).toFixed(2)} GiB / ${(memoryInfo.swaptotal / 1024 / 1024 / 1024).toFixed(2)} GiB` :
                'N/A';

            return `
📊 系统状态
------------------
适配器: ${e.adapter_name}
操作系统: ${osInfo.platform}
系统架构: ${systemArchitecture}
主机名: ${os.hostname()}
Node.js 版本: ${process.version}
CPU 信息: ${cpuDetails}
CPU 使用率: ${cpuUsage} (${cpuSpeed})
内存: ${memoryUsage}
内存交换: ${swapUsage}
系统运行时间: ${(os.uptime() / 86400).toFixed(2)} 天
`.trim();
        } catch (error) {
            return `获取基本系统信息时出错: ${error.message}`;
        }
    }

    async getAdditionalSystemInfo() {
        try {
            const [diskInfo, cpuTemperature, networkStats, users, services] = await Promise.all([
                si.fsSize(), si.cpuTemperature(), this.getNetworkBandwidth(), si.users(), si.services(['ssh', 'httpd'])
            ]);

            const disk = diskInfo[0] || {};
            const diskTotal = disk.size ? `${(disk.size / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A';
            const diskFree = disk.available ? `${(disk.available / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A';
            const diskUsed = disk.used ? `${(disk.used / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A';

            const systemTemperature = cpuTemperature.main ? `${cpuTemperature.main} °C` : 'N/A';
            const networkBandwidth = networkStats || 'N/A';
            const loadAvg = os.loadavg().map(val => val.toFixed(2)).join(' ');
            const loggedInUsers = users.length > 0 ? users.map(user => `• ${user.user}`).join('\n') : 'N/A';
            const serviceStatus = services.length > 0 ?
                services.map(service => `• ${service.name}: ${service.running ? '✅ Active' : '❌ Inactive'}`).join('\n') :
                'N/A';

            return `
💾 磁盘信息
------------------
磁盘总量 ${diskTotal}
磁盘可用量 ${diskFree}
磁盘已用量 ${diskUsed}
🌡️ 系统温度
------------------
${systemTemperature}
📡 网络使用情况
------------------
${networkBandwidth}
📈 系统负载
------------------
${loadAvg}
👥 登录用户
------------------
${loggedInUsers}
🛠️ 服务状态
------------------
${serviceStatus}
`.trim();
        } catch (error) {
            return `获取扩展系统信息时出错: ${error.message}`;
        }
    }

    async getNetworkBandwidth() {
        try {
            const [stats1, stats2] = await Promise.all([
                si.networkStats(), new Promise(resolve => setTimeout(resolve, 1000)).then(() => si.networkStats())
            ]);

            return stats2.map(stat2 => {
                const stat1 = stats1.find(s => s.iface === stat2.iface);
                if (!stat1) return `• ${stat2.iface}: In: N/A, Out: N/A`;

                const rxSpeedMB = ((stat2.rx_bytes - stat1.rx_bytes) / 1024 / 1024).toFixed(2);
                const txSpeedMB = ((stat2.tx_bytes - stat1.tx_bytes) / 1024 / 1024).toFixed(2);
                return `• ${stat2.iface}: In: ${rxSpeedMB} MB/s, Out: ${txSpeedMB} MB/s`;
            }).join('\n') || 'N/A';
        } catch {
            return 'N/A';
        }
    }
}
