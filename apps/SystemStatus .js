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
                    reg: /^#?MEMZ系统状态pro/i,
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
网络带宽使用情况: ${additionalInfo.networkBandwidth}
文件系统使用情况: ${additionalInfo.fileSystemUsage}
系统负载平均值: ${additionalInfo.loadAvg}
当前登录用户: ${additionalInfo.loggedInUsers}
服务状态: ${additionalInfo.serviceStatus}
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

        // Note: System temperature information might not be available on all systems or might require additional packages.
        let systemTemperature;
        try {
            systemTemperature = execSync('sensors | grep -i "core 0" | awk \'{print $3}\'').toString().trim();
        } catch {
            systemTemperature = 'N/A';
        }

        const networkBandwidth = this.getNetworkBandwidth();
        const fileSystemUsage = this.getFileSystemUsage();
        const loadAvg = os.loadavg().map(val => val.toFixed(2)).join(' ');
        const loggedInUsers = execSync('who | awk \'{print $1}\'').toString().trim().split('\n').join(', ');
        const serviceStatus = this.getServiceStatus();

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

    getNetworkBandwidth() {
        try {
            // Replace with appropriate command based on the system and needs
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
            // Replace with appropriate command based on the services you want to check
            const services = ['ssh', 'httpd'];
            return services.map(service => {
                const status = execSync(`systemctl is-active ${service}`).toString().trim();
                return `${service}: ${status}`;
            }).join(', ');
        } catch {
            return 'N/A';
        }
    }
}
