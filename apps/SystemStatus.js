import os from 'os';
import { exec } from 'child_process';

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
        const isWindows = os.platform() === 'win32';
        const diskTotal = await this.getDiskInfo('total');
        const diskFree = await this.getDiskInfo('free');
        const diskUsed = isWindows ? 'N/A' : await this.getDiskInfo('used');
        const systemTemperature = isWindows ? 'N/A' : await this.getSystemTemperature();
        const networkBandwidth = isWindows ? 'N/A' : await this.getNetworkBandwidth();
        const fileSystemUsage = isWindows ? 'N/A' : await this.getFileSystemUsage();
        const loadAvg = isWindows ? 'N/A' : os.loadavg().map(val => val.toFixed(2)).join(' ');
        const loggedInUsers = isWindows ? await this.getLoggedInUsers() : await this.getLinuxLoggedInUsers();
        const serviceStatus = isWindows ? await this.getServiceStatus() : await this.getLinuxServiceStatus();

        return `磁盘总量: ${diskTotal}
磁盘可用量: ${diskFree}
磁盘已用量: ${diskUsed}
系统温度: ${systemTemperature}
今日网络使用情况: ${networkBandwidth}
文件系统使用情况: ${fileSystemUsage}
系统负载平均值: ${loadAvg}
登录用户: ${loggedInUsers}
服务状态: ${serviceStatus}`;
    }

    async getDiskInfo(type) {
        const isWindows = os.platform() === 'win32';
        const command = isWindows
            ? `wmic logicaldisk get ${type}`
            : `df -h --total | awk 'END {print $${this.getDiskColumn(type)}}'`;
        return this.executeCommand(command);
    }

    getDiskColumn(type) {
        const columns = {
            total: 2,
            free: 4,
            used: 3
        };
        return columns[type] || 2;
    }

    async executeCommand(command) {
        return new Promise((resolve) => {
            exec(command, (error, stdout) => {
                if (error) {
                    resolve('N/A');
                } else {
                    resolve(stdout.split('\n')[1]?.trim() || 'N/A');
                }
            });
        });
    }

    async getSystemTemperature() {
        return this.executeCommand('sensors | grep -E "°C|N/A" | sed "s/[[:space:]]//g"')
            .catch(() => 'N/A');
    }

    async getNetworkBandwidth() {
        try {
            await this.executeCommand('apt install vnstat -y || yum install vnstat -y || pacman -S vnstat -y');
            const [i, o, t] = await Promise.all([
                this.executeCommand("vnstat --oneline | awk -F ';' '{print $4}'"),
                this.executeCommand("vnstat --oneline | awk -F ';' '{print $5}'"),
                this.executeCommand("vnstat --oneline | awk -F ';' '{print $6}'")
            ]);
            return `Inbound: ${i}\nOutbound: ${o}\nTotal: ${t}`;
        } catch {
            return '请自行安装vnstat或系统不支持';
        }
    }

    async getFileSystemUsage() {
        return this.executeCommand('df -h | awk \'{if (NR!=1) print $1 ": " $5 " used (" $3 " of " $2 ")"}\'')
            .catch(() => 'N/A');
    }

    async getLoggedInUsers() {
        return this.executeCommand('query user')
            .then(result => result.trim().split('\n').map(line => line.split(' ')[0]).join(', '))
            .catch(() => 'N/A');
    }

    async getServiceStatus() {
        const services = ['ssh', 'w3svc'];
        return Promise.all(services.map(service =>
            this.executeCommand(`sc query ${service} | findstr /R /C:"STATE"`).then(status => `${service}: ${status}`)
        )).then(statuses => statuses.join(', '))
            .catch(() => 'N/A');
    }

    async getLinuxLoggedInUsers() {
        return this.executeCommand('who | awk \'{print $1}\'')
            .then(result => result.trim().split('\n').join(', '))
            .catch(() => 'N/A');
    }

    async getLinuxServiceStatus() {
        const services = ['ssh', 'httpd'];
        return Promise.all(services.map(service =>
            this.executeCommand(`systemctl is-active ${service}`).then(status => `${service}: ${status}`)
        )).then(statuses => statuses.join(', '))
            .catch(() => 'N/A');
    }
}
