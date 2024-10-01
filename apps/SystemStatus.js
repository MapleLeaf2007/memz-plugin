import os from 'os';
import si from 'systeminformation'; // 引入 'systeminformation' 获取系统详细信息

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
        if (!(e.isMaster || e.user_id == 1011303349)) return await e.reply('就凭你也配?', true);
        try {
            await e.reply(this.basicInfo());
        } catch (error) {
            await e.reply(`Error fetching system info: ${error.message}`);
        }
    }

    async getExtendedSystemInfo(e) {
        if (!(e.isMaster || e.user_id == 1011303349)) return await e.reply('就凭你也配?', true);
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
        return `
📊 **系统状态**
────────────────────────
**操作系统**: ${stats.osType}
**系统架构**: ${stats.arch}
**主机名**: ${stats.hostname}
**Node.js 版本**: ${stats.nodeVersion}
**总内存**: ${stats.totalMem} MB
**空闲内存**: ${stats.freeMem} MB
**已用内存**: ${stats.usedMem} MB
**系统运行时间**: ${stats.uptime} 天
**CPU 数量**: ${stats.cpuCount}
**CPU 负载**: ${stats.cpuLoad}
`.trim();
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
            nodeVersion: process.version, // 获取 Node.js 版本
            totalMem,
            freeMem,
            usedMem,
            uptime,
            cpuCount: os.cpus().length,
            cpuLoad
        };
    }

    async getAdditionalSystemInfo() {
        try {
            const [diskInfo, cpuTemperature, networkStats, users, services] = await Promise.all([
                si.fsSize(),
                si.cpuTemperature(),
                this.getNetworkBandwidth(), // 获取实时网络带宽
                si.users(),
                si.services(['ssh', 'httpd'])
            ]);

            // 磁盘信息
            const disk = diskInfo[0] || {};
            const diskTotal = disk.size ? `${(disk.size / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A';
            const diskFree = disk.available ? `${(disk.available / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A';
            const diskUsed = disk.used ? `${(disk.used / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A';

            // 系统温度
            const systemTemperature = cpuTemperature.main ? `${cpuTemperature.main} °C` : 'N/A';

            // 网络使用情况
            const networkBandwidth = networkStats || 'N/A';

            // 系统负载平均值
            const loadAvg = os.loadavg().map(val => val.toFixed(2)).join(' ');

            // 登录用户
            const loggedInUsers = users.length > 0
                ? users.map(user => `• ${user.user}`).join('\n')
                : 'N/A';

            // 服务状态
            const serviceStatus = services.length > 0
                ? services.map(service => `• **${service.name}**: ${service.running ? '✅ Active' : '❌ Inactive'}`).join('\n')
                : 'N/A';

            return `
💾 **磁盘信息**
────────────────────────
**磁盘总量**: ${diskTotal}
**磁盘可用量**: ${diskFree}
**磁盘已用量**: ${diskUsed}
🌡️ **系统温度**
────────────────────────
${systemTemperature}
📡 **网络使用情况**
────────────────────────
${networkBandwidth}
📈 **系统负载**
────────────────────────
${loadAvg}
👥 **登录用户**
────────────────────────
${loggedInUsers}
🛠️ **服务状态**
────────────────────────
${serviceStatus}
`.trim();
        } catch (error) {
            return `获取扩展系统信息时出错: ${error.message}`;
        }
    }

    /**
     * 获取实时网络带宽（上传和下载速度）
     * @returns {Promise<string>} 格式化的网络带宽信息
     */
    async getNetworkBandwidth() {
        try {
            // 获取第一次的网络统计数据
            const stats1 = await si.networkStats();
            // 等待1秒
            await new Promise(resolve => setTimeout(resolve, 1000));
            // 获取第二次的网络统计数据
            const stats2 = await si.networkStats();

            // 计算每个接口的上传和下载速度
            const bandwidth = stats2.map((stat, index) => {
                const correspondingStat1 = stats1.find(s => s.iface === stat.iface);
                if (!correspondingStat1) return `• **${stat.iface}**: In: N/A, Out: N/A`;

                const rxBytes = stat.rx_bytes - correspondingStat1.rx_bytes;
                const txBytes = stat.tx_bytes - correspondingStat1.tx_bytes;
                const rxSpeedMB = (rxBytes / 1024 / 1024).toFixed(2);
                const txSpeedMB = (txBytes / 1024 / 1024).toFixed(2);
                return `• **${stat.iface}**: In: ${rxSpeedMB} MB/s, Out: ${txSpeedMB} MB/s`;
            }).join('\n') || 'N/A';

            return bandwidth;
        } catch (error) {
            return 'N/A';
        }
    }
}
