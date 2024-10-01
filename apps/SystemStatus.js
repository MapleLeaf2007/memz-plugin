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
        if (!e.isMaster) return await e.reply('就凭你也配?', true);
        try {
            const info = await this.basicInfo();
            await e.reply(info);
        } catch (error) {
            await e.reply(`获取系统信息时出错: ${error.message}`);
        }
    }

    async getExtendedSystemInfo(e) {
        if (!e.isMaster) return await e.reply('就凭你也配?', true);
        try {
            const basicInfo = await this.basicInfo();
            const additionalInfo = await this.getAdditionalSystemInfo();
            const message = `${basicInfo}\n${additionalInfo}`;
            await e.reply(message);
        } catch (error) {
            await e.reply(`获取扩展系统信息时出错: ${error.message}`);
        }
    }

    /**
     * 获取基本系统信息
     * @returns {Promise<string>} 格式化的基本系统信息
     */
    async basicInfo() {
        const [
            osInfo,
            cpuInfo,
            currentLoad,
            memoryInfo
        ] = await Promise.all([
            si.osInfo(),
            si.cpu(),
            si.currentLoad(),
            si.mem()
        ]);

        // 系统架构：内核版本 + 架构
        const systemArchitecture = `${osInfo.distro} ${osInfo.release} ${osInfo.arch}`;

        // CPU 使用率和频率
        const cpuUsage = currentLoad.currentLoad.toFixed(2) + '%';
        const cpuSpeed = cpuInfo.speed ? `${cpuInfo.speed} GHz` : 'N/A';

        // CPU 信息：核心数 + 型号
        const cpuDetails = `${cpuInfo.physicalCores}核 ${cpuInfo.brand}`;

        // 内存使用情况
        const usedMemoryGiB = (memoryInfo.active / 1024 / 1024 / 1024).toFixed(2);
        const totalMemoryGiB = (memoryInfo.total / 1024 / 1024 / 1024).toFixed(2);
        const memoryUsagePercent = ((memoryInfo.active / memoryInfo.total) * 100).toFixed(2) + '%';
        const memoryUsage = `${usedMemoryGiB} GiB / ${totalMemoryGiB} GiB (${memoryUsagePercent})`;

        // 内存交换（Swap）使用情况
        const usedSwapGiB = (memoryInfo.swaptotal - memoryInfo.swapfree) / 1024 / 1024 / 1024;
        const swapUsageGiB = usedSwapGiB.toFixed(2);
        const totalSwapGiB = (memoryInfo.swaptotal / 1024 / 1024 / 1024).toFixed(2);
        const swapUsagePercent = memoryInfo.swaptotal > 0 ? ((usedSwapGiB / memoryInfo.swaptotal) * 100).toFixed(2) + '%' : 'N/A';
        const swapUsage = memoryInfo.swaptotal > 0 ? `${swapUsageGiB} GiB / ${totalSwapGiB} GiB (${swapUsagePercent})` : 'N/A';

        return `
📊 **系统状态**
────────────────────────
**适配器**: ${this.e.adapter_name}
**操作系统**: ${osInfo.platform}
**系统架构**: ${systemArchitecture}
**主机名**: ${os.hostname()}
**Node.js 版本**: ${process.version}
**CPU 信息**: ${cpuDetails}
**CPU 使用率**: ${cpuUsage} (${cpuSpeed})
**内存**: ${memoryUsage}
**内存交换**: ${swapUsage}
**系统运行时间**: ${(os.uptime() / 86400).toFixed(2)} 天
`.trim();
    }

    /**
     * 获取扩展系统信息
     * @returns {Promise<string>} 格式化的扩展系统信息
     */
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
            const bandwidth = stats2.map(stat2 => {
                const stat1 = stats1.find(s => s.iface === stat2.iface);
                if (!stat1) return `• **${stat2.iface}**: In: N/A, Out: N/A`;

                const rxBytes = stat2.rx_bytes - stat1.rx_bytes;
                const txBytes = stat2.tx_bytes - stat1.tx_bytes;
                const rxSpeedMB = (rxBytes / 1024 / 1024).toFixed(2);
                const txSpeedMB = (txBytes / 1024 / 1024).toFixed(2);
                return `• **${stat2.iface}**: In: ${rxSpeedMB} MB/s, Out: ${txSpeedMB} MB/s`;
            }).join('\n') || 'N/A';

            return bandwidth;
        } catch (error) {
            return 'N/A';
        }
    }
}
