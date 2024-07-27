import ping from 'ping';

export class PingPlugin extends plugin {
    constructor() {
        super({
            name: 'ping',
            dsc: '本地ping',
            event: 'message',
            priority: 6,
            rule: [
                {
                    reg: '^#?ping\\s*(.+)',
                    fnc: 'pingHandler'
                }
            ]
        });
    }

    async pingHandler(e) {
        let host = e.msg.match(/^#?ping\s*(.+)/)[1].trim();

        try {
            const result = await this.pingHost(host);
            const message = `------MEMZ-Ping------
主机: ${result.host}
状态: ${result.alive ? '在线' : '不在线'}
响应时间: ${result.time} ms
包损失率: ${result.packetLoss}%`;

            await e.reply(message);
        } catch (error) {
            await e.reply(`Error pinging host: ${error.message}`);
        }
    }

    async pingHost(host) {
        return new Promise((resolve, reject) => {
            ping.promise.probe(host, { timeout: 10 })
                .then((res) => {
                    resolve({
                        host: res.host,
                        alive: res.alive,
                        time: res.time,
                        packetLoss: res.packetLoss
                    });
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
}
