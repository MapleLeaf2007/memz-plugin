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
    basicInfo() {
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

        return message;
    }

    async getSystemInfo(e) {
	    if (!e.isMaster) return await e.reply('你没有权限awa');
	    try {
	        await e.reply(this.basicInfo());
        } catch (error) {
	        await e.reply(`获取系统信息错误: ${error.message}`);
	    }
    }

    async getExtendedSystemInfo(e) {
        if (!e.isMaster) return await e.reply('你没有权限awa');
        try {
            const additionalInfo = this.getAdditionalSystemInfo();
            const message = this.basicInfo()+'\n'+additionalInfo;
            await e.reply(message);
        } catch (error) {
            await e.reply(`获取附加系统信息错误: ${error.message}`);
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
            ? this.getWindowsDiskInfo('size')
            : this.getLinuxDiskInfo('total');

        const diskFree = isWindows
            ? this.getWindowsDiskInfo('freespace')
            : this.getLinuxDiskInfo('free');

        const diskUsed = isWindows
            ? 'N/A'
            : this.getLinuxDiskInfo('used');

        const networkInterfaces = isWindows
            ? this.getWindowsNetworkInterfaces()
            : this.getLinuxNetworkInterfaces();

        const systemTemperature = isWindows
            ? 'N/A'
            : this.getLinuxSystemTemperature();

        const networkBandwidth = isWindows
            ? 'N/A'
            : this.getLinuxNetworkBandwidth();

        const fileSystemUsage = isWindows
            ? 'N/A'
            : this.getLinuxFileSystemUsage();

        const loadAvg = isWindows
            ? 'N/A'
            : os.loadavg().map(val => val.toFixed(2)).join(' ');

        const loggedInUsers = isWindows
            ? this.getWindowsLoggedInUsers()
            : this.getLinuxLoggedInUsers();

        const serviceStatus = isWindows
            ? this.getWindowsServiceStatus()
            : this.getLinuxServiceStatus();

        return `磁盘总空间: ${diskTotal}
磁盘可用空间: ${diskFree}
磁盘已用空间: ${diskUsed}
网络接口信息: ${networkInterfaces}
系统温度: ${systemTemperature}
今日网络使用情况: ${networkBandwidth}
文件系统使用情况: ${fileSystemUsage}
系统负载平均值: ${loadAvg}
已登录用户: ${loggedInUsers}
服务状态: ${serviceStatus}`;
    }

    getWindowsDiskInfo(type) {
        try {
            return execSync(`wmic logicaldisk get ${type}`).toString().split('\n')[1]?.trim() || 'N/A';
        } catch {
            return 'N/A';
        }
    }

    getWindowsNetworkInterfaces() {
        try {
            return execSync('ipconfig').toString().split('\n').filter(line => line.includes('IPv4')).join('; ');
        } catch {
            return 'N/A';
        }
    }

    getWindowsLoggedInUsers() {
        try {
            return execSync('query user').toString().trim().split('\n').map(line => line.split(' ')[0]).join(', ');
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

    getLinuxDiskInfo(type) {
        try {
            return '\n'+execSync(`df -h --total | grep total | awk '{print $${this.getDiskColumn(type)}}'`).toString().trim() || 'N/A';
        } catch {
            return 'N/A';
        }
    }

    getDiskColumn(type) {
        switch (type) {
            case 'total': return 2;
            case 'free': return 4;
            case 'used': return 3;
            default: return 2;
        }
    }

    getLinuxNetworkInterfaces() {
        return Object.entries(os.networkInterfaces())
            .map(([name, infos]) => `${name}: ${infos.map(info => info.address).join(', ')}`)
            .join('; ');
    }

    getLinuxSystemTemperature() {
        try {
            return execSync('sensors | grep -E "°C|N/A" | sed "s/[[:space:]]//g"').toString().trim();
        } catch {
            return 'N/A';
        }
    }

    getLinuxNetworkBandwidth() {
	try {
	    execSync('apt install vnstat -y || yum install vnstat -y || pacman -S vnstat -y')
        } catch {
	    return '请自行安装vnstat或系统不支持'
	} const i = execSync("vnstat --oneline | awk -F ';' \'{print $4}\'").toString().trim();
	const o = execSync("vnstat --oneline | awk -F ';' \'{print $5}\'").toString().trim();
	const t = execSync("vnstat --oneline | awk -F ';' \'{print $6}\'").toString().trim();
	return '\nInbound: '+i+'\nOutbound: '+o+'\nTotal: '+t;
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
