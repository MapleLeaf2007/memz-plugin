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
                    reg: /^#memz(插件)?系统状态pro/i,
                    fnc: 'getExtendedSystemInfo'
                },
                {
                    reg: /^#memz(插件)?系统状态$/i,
                    fnc: 'getSystemInfo'
                }
            ]
        });
    }

    async getSystemInfo(e) {
        if (!e.isMaster) return await e.reply('就凭你也配');

        try {
            const stats = this.getSystemStats();
            const message = this.formatSystemInfo(stats);
            await e.reply(message);
        } catch (error) {
            await e.reply(`Error fetching system info: ${error.message}`);
        }
    }

    async getExtendedSystemInfo(e) {
        if (!e.isMaster) return await e.reply('就凭你也配');

        try {
            console.log('Fetching extended system info...');
            const stats = this.getSystemStats();
            const additionalInfo = this.getAdditionalSystemInfo();
            const message = this.formatExtendedSystemInfo(stats, additionalInfo);
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
        const isWindows = os.platform() === 'win32';

        const diskTotal = isWindows
            ? this.execCommand('wmic logicaldisk get size').split('\n')[1] || 'N/A'
            : this.execCommand('df -h --total | grep total | awk \'{print $2}\'');

        const diskFree = isWindows
            ? this.execCommand('wmic logicaldisk get freespace').split('\n')[1] || 'N/A'
            : this.execCommand('df -h --total | grep total | awk \'{print $4}\'');

        const diskUsed = isWindows
            ? 'N/A'
            : this.execCommand('df -h --total | grep total | awk \'{print $3}\'');

        const networkInterfaces = isWindows
            ? this.execCommand('ipconfig | findstr "IPv4"')
            : Object.entries(os.networkInterfaces())
                .map(([name, infos]) => `${name}: ${infos.map(info => info.address).join(', ')}`)
                .join('; ');

        const systemTemperature = isWindows
            ? 'N/A'
            : this.getSystemTemperature();

        const networkBandwidth = isWindows
            ? 'N/A'
            : this.getNetworkBandwidth();

        const fileSystemUsage = isWindows
            ? 'N/A'
            : this.getFileSystemUsage();

        const loadAvg = isWindows
            ? 'N/A'
            : os.loadavg().map(val => val.toFixed(2)).join(' ');

        const loggedInUsers = isWindows
            ? this.execCommand('query user').split('\n').map(line => line.split(' ')[0]).join(', ')
            : this.execCommand('who | awk \'{print $1}\'');

        const serviceStatus = isWindows
            ? this.getWindowsServiceStatus()
            : this.getServiceStatus();

        return {
            diskTotal,
            diskFree,
            diskUsed,
            networkInterfaces,
            systemTemperature,
            networkBandwidth,
            fileSystemUsage,
            loadAvg,
            loggedInUsers,
            serviceStatus
        };
    }

    execCommand(command) {
        try {
            return execSync(command).toString().trim() || 'N/A';
        } catch {
            return 'N/A';
        }
    }

    getSystemTemperature() {
        try {
            return execSync('sensors | grep -i "core 0" | awk \'{print $3}\'').toString().trim() || 'N/A';
        } catch {
            return 'N/A';
        }
    }

    getNetworkBandwidth() {
        try {
            return execSync('vnstat --oneline | awk -F";" \'{print "Inbound: " $2 " MB, Outbound: " $3 " MB"}\'').toString().trim();
        } catch {
            return 'N/A';
        }
    }

    getFileSystemUsage() {
        try {
            return execSync('df -h | awk \'{if (NR!=1) print $1 ": " $5 " used (" $3 " of " $2 ")"}\'').toString().trim();
        } catch {
            return 'N/A';
        }
    }

    getServiceStatus() {
        try {
            const services = ['ssh', 'httpd']; // You can add more services to check
            return services.map(service => {
                try {
                    const status = execSync(`systemctl is-active ${service}`).toString().trim();
                    return `${service}: ${status}`;
                } catch {
                    return `${service}: N/A`;
                }
            }).join(', ');
        } catch {
            return 'N/A';
        }
    }

    getWindowsServiceStatus() {
        try {
            const services = ['ssh', 'w3svc']; // Modify service names as needed
            return services.map(service => {
                try {
                    const status = execSync(`sc query ${service} | findstr /R /C:"STATE"`).toString().trim();
                    return `${service}: ${status}`;
                } catch {
                    return `${service}: N/A`;
                }
            }).join(', ');
        } catch {
            return 'N/A';
        }
    }

    formatSystemInfo(stats) {
        return `--------系统状态--------
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

    formatExtendedSystemInfo(stats, additionalInfo) {
        return `--------系统状态--------
操作系统: ${stats.osType}
系统架构: ${stats.arch}
主机名: ${stats.hostname}
总内存: ${stats.totalMem} MB
空闲内存: ${stats.freeMem} MB
已用内存: ${stats.usedMem} MB
系统运行时间: ${stats.uptime} 天
CPU 数量: ${stats.cpuCount}
CPU 负载: ${stats.cpuLoad}
磁盘总量: ${additionalInfo.diskTotal}
磁盘可用量: ${additionalInfo.diskFree}
磁盘已用量: ${additionalInfo.diskUsed}
系统温度: ${additionalInfo.systemTemperature}
网络带宽使用情况: ${additionalInfo.networkBandwidth}
文件系统使用情况: ${additionalInfo.fileSystemUsage}
系统负载平均值: ${additionalInfo.loadAvg}
登录用户: ${additionalInfo.loggedInUsers}
服务状态: ${additionalInfo.serviceStatus}`;
    }
}
