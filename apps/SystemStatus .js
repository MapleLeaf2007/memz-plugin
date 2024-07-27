import os from 'os';
import { execSync } from 'child_process';
import fs from 'fs';
import puppeteer from 'puppeteer';

export class SystemStatus extends plugin {
    constructor() {
        super({
            name: '系统状态',
            dsc: '系统状态',
            event: 'message',
            priority: 6,
            rule: [
                {
                    reg: /^#(memz)?(插件)?系统状态pro/i,
                    fnc: 'getExtendedSystemInfo'
                },
                {
                    reg: /^#(memz)?(插件)?系统状态$/i,
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
CPU 负载: ${stats.cpuLoad}
磁盘总量: ${stats.diskTotal}
磁盘可用量: ${stats.diskFree}`;

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
磁盘总量: ${stats.diskTotal}
磁盘可用量: ${stats.diskFree}
磁盘已用量: ${stats.diskUsed}
系统温度: ${stats.systemTemperature}
网络带宽使用情况: ${stats.networkBandwidth}
文件系统使用情况: ${stats.fileSystemUsage}
系统负载平均值: ${stats.loadAvg}
登录用户: ${stats.loggedInUsers}
服务状态: ${stats.serviceStatus}`;

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

        const diskTotal = this.getDiskInfo('total');
        const diskFree = this.getDiskInfo('free');

        return {
            osType: os.type(),
            arch: os.arch(),
            hostname: os.hostname(),
            totalMem,
            freeMem,
            usedMem,
            uptime,
            cpuCount: cpus.length,
            cpuLoad,
            diskTotal,
            diskFree
        };
    }

    getDiskInfo(type) {
        const isWindows = os.platform() === 'win32';
        if (isWindows) {
            try {
                const command = type === 'total' ? 'wmic logicaldisk get size' : 'wmic logicaldisk get freespace';
                const output = execSync(command).toString().split('\n')[1]?.trim();
                return (parseInt(output, 10) / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
            } catch {
                return 'N/A';
            }
        } else {
            try {
                const command = type === 'total' ? 'df -h --total | grep total | awk \'{print $2}\'' : 'df -h --total | grep total | awk \'{print $4}\'';
                return execSync(command).toString().trim();
            } catch {
                return 'N/A';
            }
        }
    }

    getAdditionalSystemInfo() {
        const isWindows = os.platform() === 'win32';

        const diskUsed = isWindows ? 'N/A' : this.getDiskInfo('used');

        const networkInterfaces = isWindows
            ? this.getWindowsNetworkInterfaces()
            : this.getLinuxNetworkInterfaces();

        const systemTemperature = isWindows ? 'N/A' : this.getLinuxSystemTemperature();

        const networkBandwidth = isWindows ? 'N/A' : this.getLinuxNetworkBandwidth();

        const fileSystemUsage = isWindows ? 'N/A' : this.getLinuxFileSystemUsage();

        const loadAvg = isWindows ? 'N/A' : os.loadavg().map(val => val.toFixed(2)).join(' ');

        const loggedInUsers = isWindows ? 'N/A' : this.getLinuxLoggedInUsers();

        const serviceStatus = isWindows ? this.getWindowsServiceStatus() : this.getLinuxServiceStatus();

        return {
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

    getWindowsNetworkInterfaces() {
        try {
            return execSync('ipconfig').toString().split('\n').filter(line => line.includes('IPv4')).join('; ');
        } catch {
            return 'N/A';
        }
    }

    getLinuxNetworkInterfaces() {
        return Object.entries(os.networkInterfaces())
            .map(([name, infos]) => `${name}: ${infos.map(info => info.address).join(', ')}`)
            .join('; ');
    }

    getLinuxSystemTemperature() {
        try {
            return execSync('sensors | grep -i "core 0" | awk \'{print $3}\'').toString().trim();
        } catch {
            return 'N/A';
        }
    }

    getLinuxNetworkBandwidth() {
        try {
            return execSync('vnstat --oneline | awk -F";" \'{print "Inbound: " $2 " MB, Outbound: " $3 " MB"}\'').toString().trim();
        } catch {
            return 'N/A';
        }
    }

    getLinuxFileSystemUsage() {
        try {
            return execSync('df -h | awk \'{if (NR!=1) print $1 ": " $5 " used (" $3 " of " $2 ")"}\'').toString().trim();
        } catch {
            return 'N/A';
        }
    }

    getLinuxLoggedInUsers() {
        try {
            return execSync('who | awk \'{print $1}\'').toString().trim().split('\n').join(', ');
        } catch {
            return 'N/A';
        }
    }

    getWindowsServiceStatus() {
        try {
            const services = ['ssh', 'w3svc'];
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

    getLinuxServiceStatus() {
        try {
            const services = ['ssh', 'httpd'];
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
}
