export default async (req, res) => {
    if (req.method === 'GET') {
        try {
            const response = await fetch('https://api.bilibili.com/x/web-interface/wbi/search/square?limit=10');
            const rawData = await response.json();
            const time = new Date().toISOString();
            const title = 'BiliBili熱榜'
            const source = 'MEMZ-Plugin'
            if (rawData.code === 0 && rawData.data?.trending?.list) {
                const parsedData = rawData.data.trending.list.map(item => ({
                    show_name: item.show_name || '',
                    heat_score: item.heat_score || 0
                }));

                const result = {
                    code: 0,
                    message: '解析成功',
                    title: title,
                    time: time,
                    data: parsedData,
                    source: source
                };

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(result));
            } else {
                throw new Error('接口返回數據格式異常');
            }
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                code: 500,
                message: '解析失败',
                title: title,
                time: time,
                error: error.message,
                source: source
            }));
        }
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('405 方法不允许');
    }
};
