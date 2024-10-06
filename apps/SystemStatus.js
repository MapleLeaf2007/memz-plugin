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
                { reg: /^#(memz)?(插件)?系统状态promax/i, fnc: 'getMaxExtendedSystemInfo' },
                { reg: /^#(memz)?(插件)?系统状态pro/i, fnc: 'getExtendedSystemInfo' },
                { reg: /^#(memz)?(插件)?系统状态$/i, fnc: 'getSystemInfo' }
            ]
        });
    }

    async handleMasterCheck(e) {
        if (!e.isMaster) {
            await e.reply('你没有权限呐QAQ', true);
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
            const [basicInfo, additionalInfo, gpuInfo, batteryInfo, processInfo, networkConnections] = await Promise.all([
                this.basicInfo(e),
                this.getAdditionalSystemInfo(),
                this.getGPUInfo(),
                this.getBatteryInfo(),
                this.getProcessInfo(),
                this.getNetworkConnections()
            ]);
            await e.reply(`${basicInfo}\n${additionalInfo}\n${gpuInfo}\n${batteryInfo}\n${processInfo}\n${networkConnections}`);
        } catch (error) {
            await e.reply(`获取扩展系统信息时出错: ${error.message}`);
        }
    }

    async getMaxExtendedSystemInfo(e) {
        if (!(await this.handleMasterCheck(e))) return;
        try {
            const [
                basicInfo,
                additionalInfo,
                gpuInfo,
                batteryInfo,
                processInfo,
                networkConnections,
                diskDetailedInfo,
                serviceDetails,
                environmentInfo,
                installedSoftware,
                openPorts,
                motherboardInfo,
                ramInfo
            ] = await Promise.all([
                this.basicInfo(e),
                this.getAdditionalSystemInfo(),
                this.getGPUInfo(),
                this.getBatteryInfo(),
                this.getProcessInfo(),
                this.getNetworkConnections(),
                this.getDiskDetailedInfo(),
                this.getServiceDetails(),
                //this.getEnvironmentInfo(),
                this.getInstalledSoftware(),
                //this.getOpenPorts(),
                this.getMotherboardInfo(),
                this.getRamInfo()
            ]);
            await e.reply(`${basicInfo}\n${additionalInfo}\n${gpuInfo}\n${batteryInfo}\n${processInfo}\n${networkConnections}\n${diskDetailedInfo}\n${serviceDetails}\n${environmentInfo}\n${installedSoftware}\n${openPorts}\n${motherboardInfo}\n${ramInfo}`);
        } catch (error) {
            await e.reply(`获取最大扩展系统信息时出错: ${error.message}`);
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

            const diskDetails = diskInfo.map(disk => {
                const total = disk.size ? `${(disk.size / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A';
                const free = disk.available ? `${(disk.available / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A';
                const used = disk.used ? `${(disk.used / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A';
                return `• ${disk.fs} (${disk.type}): 总量 ${total}, 可用 ${free}, 已用 ${used}`;
            }).join('\n') || 'N/A';

            const systemTemperature = cpuTemperature.main ? `${cpuTemperature.main} °C` : 'N/A';
            const networkBandwidth = networkStats || 'N/A';
            const loadAvg = os.loadavg().map(val => val.toFixed(2)).join(' ');
            const loggedInUsers = users.length > 0 ? users.map(user => `• ${user.user}`).join('\n') : 'N/A';
            const serviceStatus = services.length > 0 ?
                services.map(service => `• ${service.name}: ${service.running ? '✅ Active' : '❌ Inactive'}`).join('\n') :
                'N/A';

            return `
💾 磁盘信息

${diskDetails}
🌡️ 系统温度

${systemTemperature}
📡 网络使用情况

${networkBandwidth}
📈 系统负载

${loadAvg}
👥 登录用户

${loggedInUsers}
🛠️ 服务状态

${serviceStatus}
            `.trim();
        } catch (error) {
            return `获取扩展系统信息时出错: ${error.message}`;
        }
    }

    async getDiskDetailedInfo() {
        try {
            const diskPartitions = await si.diskLayout();
            if (!diskPartitions || diskPartitions.length === 0) {
                return '📂 磁盘分区详情: N/A';
            }

            const partitionsInfo = diskPartitions.map(partition => {
                return `• ${partition.device} - ${partition.type} - ${partition.size ? (partition.size / (1024 ** 3)).toFixed(2) + ' GB' : 'N/A'} - ${partition.name || 'N/A'}`;
            }).join('\n');

            return `
📂 磁盘分区详情

${partitionsInfo}
            `.trim();
        } catch (error) {
            return `获取磁盘分区信息时出错: ${error.message}`;
        }
    }

    async getServiceDetails() {
        try {
            const services = await si.services();
            if (!services || services.length === 0) {
                return '🛠️ 系统服务详情: N/A';
            }

            const serviceDetails = services.map(service => {
                return `• ${service.name}: ${service.running ? '✅ Active' : '❌ Inactive'}`;
            }).join('\n');

            return `
🛠️ 系统服务详情

${serviceDetails}
            `.trim();
        } catch (error) {
            return `获取系统服务详情时出错: ${error.message}`;
        }
    }

    async getEnvironmentInfo() {
        try {
            const envVars = process.env;
            const envInfo = Object.keys(envVars).map(key => `• ${key}: ${envVars[key]}`).join('\n') || 'N/A';

            return `
🛢️ 环境变量信息

${envInfo}
            `.trim();
        } catch (error) {
            return `获取环境变量信息时出错: ${error.message}`;
        }
    }

    async getInstalledSoftware() {
        try {
            const { exec } = require('child_process');
            const execAsync = (cmd) => new Promise((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) reject(error);
                    else resolve(stdout);
                });
            });

            if (os.platform() === 'win32') {
                const stdout = await execAsync('wmic product get name,version');
                const lines = stdout.split('\n').slice(1).filter(line => line.trim() !== '');
                const softwareList = lines.slice(0, 10).map(line => {
                    const [name, version] = line.trim().split(/\s{2,}/);
                    return `• ${name || '未知软件'} - 版本: ${version || 'N/A'}`;
                }).join('\n') || 'N/A';

                return `🖥️ 已安装的软件列表 (Windows，仅显示前10项)\n\n${softwareList}`;

            } else if (os.platform() === 'linux') {
                const stdout = await execAsync('dpkg --get-selections');
                const lines = stdout.split('\n').filter(line => line.trim() !== '');
                const softwareList = lines.slice(0, 10).map(line => {
                    const [name, status] = line.trim().split(/\s+/);
                    return `• ${name} - 状态: ${status}`;
                }).join('\n') || 'N/A';

                return `🖥️ 已安装的软件列表 (Linux，仅显示前10项)\n\n${softwareList}`;

            } else {
                return '🖥️ 已安装的软件列表: 不支持的平台或功能';
            }
        } catch (error) {
            return `获取已安装的软件列表时出错: ${error.message}`;
        }
    }


    async getOpenPorts() {
        try {
            const connections = await si.networkConnections();
            if (!connections || connections.length === 0) {
                return '🔓 开放端口: 无开放端口';
            }

            const openPorts = connections.filter(conn => conn.state === 'LISTEN').slice(0, 10).map(conn => {
                return `• ${conn.protocol.toUpperCase()} ${conn.localaddress}:${conn.localport} (${conn.pid ? 'PID: ' + conn.pid : 'N/A'})`;
            }).join('\n') || 'N/A';

            return `
🔓 开放端口

${openPorts}
            `.trim();
        } catch (error) {
            return `获取开放端口信息时出错: ${error.message}`;
        }
    }

    async getMotherboardInfo() {
        try {
            const motherboard = await si.baseboard();
            if (!motherboard || Object.keys(motherboard).length === 0) {
                return '🖥️ 主板信息: N/A';
            }

            const info = `
• 生产商: ${motherboard.manufacturer || 'N/A'}
• 产品: ${motherboard.product || 'N/A'}
• 版本: ${motherboard.version || 'N/A'}
• 序列号: ${motherboard.serial || 'N/A'}
            `.trim();

            return `
🖥️ 主板信息

${info}
            `.trim();
        } catch (error) {
            return `获取主板信息时出错: ${error.message}`;
        }
    }

    async getRamInfo() {
        try {
            const memory = await si.memLayout();
            if (!memory || memory.length === 0) {
                return '💾 RAM 信息: N/A';
            }

            const ramDetails = memory.map((mem, index) => {
                return `• 内存条 ${index + 1}: ${mem.type || 'N/A'}, ${mem.size / (1024 ** 3)} GB, ${mem.clock} MHz`;
            }).join('\n');

            return `
💾 RAM 信息

${ramDetails}
            `.trim();
        } catch (error) {
            return `获取 RAM 信息时出错: ${error.message}`;
        }
    }

    async getGPUInfo() {
        try {
            const gpuData = await si.graphics();
            if (!gpuData || !gpuData.controllers || gpuData.controllers.length === 0) {
                return '🎮 GPU 信息: N/A';
            }

            const gpuDetails = gpuData.controllers.map(gpu => {
                return `• ${gpu.model} - ${gpu.vendor} - ${gpu.memoryTotal} MB`;
            }).join('\n');

            return `
🎮 GPU 信息

${gpuDetails}
            `.trim();
        } catch (error) {
            return `获取 GPU 信息时出错: ${error.message}`;
        }
    }

    async getBatteryInfo() {
        try {
            const battery = await si.battery();
            if (!battery || battery.hasBattery === false) {
                return '🔋 电池状态: 不适用';
            }

            const status = battery.isCharging ? '充电中' : '未充电';
            const capacity = battery.percent ? `${battery.percent}%` : 'N/A';
            const timeRemaining = battery.timeRemaining !== -1 ? `${battery.timeRemaining} 分钟` : 'N/A';

            return `
🔋 电池状态

状态: ${status}
容量: ${capacity}
剩余时间: ${timeRemaining}
            `.trim();
        } catch (error) {
            return `获取电池信息时出错: ${error.message}`;
        }
    }

    async getProcessInfo() {
        try {
            const processes = await si.processes();
            const sortedByCpu = processes.list.sort((a, b) => b.cpu - a.cpu).slice(0, 5);
            const sortedByMemory = processes.list.sort((a, b) => b.mem - a.mem).slice(0, 5);

            const topCpu = sortedByCpu.map(proc => `• ${proc.name} (PID: ${proc.pid}) - CPU: ${proc.cpu.toFixed(2)}%`).join('\n') || 'N/A';
            const topMemory = sortedByMemory.map(proc => `• ${proc.name} (PID: ${proc.pid}) - 内存: ${(proc.mem / 1024).toFixed(2)} MB`).join('\n') || 'N/A';

            return `
📋 进程信息

🔼 CPU 使用率最高的进程:
${topCpu}

🔼 内存使用率最高的进程:
${topMemory}
            `.trim();
        } catch (error) {
            return `获取进程信息时出错: ${error.message}`;
        }
    }

    async getNetworkConnections() {
        try {
            const connections = await si.networkConnections();
            if (!connections || connections.length === 0) {
                return '🌐 网络连接: 无活动连接';
            }

            const activeConnections = connections.slice(0, 5).map(conn => {
                const protocol = conn.protocol ? conn.protocol.toUpperCase() : 'UNKNOWN';
                const localAddress = conn.localaddress || 'undefined';
                const localPort = conn.localport || 'undefined';
                const peerAddress = conn.peeraddress || 'undefined';
                const peerPort = conn.peerport || 'undefined';
                const state = conn.state || 'UNKNOWN';

                return `• ${protocol} ${localAddress}:${localPort} -> ${peerAddress}:${peerPort} (${state})`;
            }).join('\n') || 'N/A';

            return `
🌐 网络连接

${activeConnections}
            `.trim();
        } catch (error) {
            return `获取网络连接信息时出错: ${error.message}`;
        }
    }

    async getNetworkBandwidth() {
        try {
            const [stats1, stats2] = await Promise.all([
                si.networkStats(),
                new Promise(resolve => setTimeout(resolve, 1000)).then(() => si.networkStats())
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
