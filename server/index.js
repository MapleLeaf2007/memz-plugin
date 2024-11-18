import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { pathToFileURL } from 'url';
import { Plugin_Path } from '../components/Path.js';
import Config from '../components/Config.js';

let config = {};
const requestStats = {}; // 记录每个 IP 和接口的访问统计
const apiHandlersCache = {}; // 缓存

// 加载配置
const loadConfig = async () => {
    try {
        config = Config.getConfig("api");
        logger.debug(chalk.green('[memz-plugin]API服務配置加載成功!', config));
    } catch (err) {
        logger.error(chalk.red('[memz-plugin]API服務配置加载失败'), err.message);
    }
};

await loadConfig();

// 统计 API 加载情况
let loadStats = {
    success: 0,
    failure: 0,
    totalTime: 0,
};
const loadApiHandler = async (filePath) => {
    const baseName = path.basename(filePath, '.js');
    let route = `/${baseName}`;

    try {
        const fileUrl = pathToFileURL(filePath);
        const handlerModule = await import(fileUrl);
        const handler = handlerModule.default;

        if (typeof handler === 'function') {
            apiHandlersCache[route] = handler;
            logger.info(chalk.blueBright(`[memz-plugin]API加载完成 路由: ${route}`));
            loadStats.success++;
        } else {
            logger.warn(chalk.yellow(`[memz-plugin]API服務跳过无效文件: ${filePath}`));
            loadStats.failure++;
        }
    } catch (err) {
        logger.error(chalk.red(`[memz-plugin]API加载失败: ${filePath}`), err.message);
        loadStats.failure++;
    }
};


// 更新请求统计
const updateRequestStats = (ip, route) => {
    if (!requestStats[ip]) {
        requestStats[ip] = { total: 0 };
    }
    if (!requestStats[ip][route]) {
        requestStats[ip][route] = 0;
    }
    requestStats[ip].total++;
    requestStats[ip][route]++;
};

// 健康检查
const healthCheck = (req, res) => {
    const message = '服务正常';
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
        status: message,
        time: new Date().toLocaleString(),
        totalRequests: Object.values(requestStats).reduce((sum, ipStats) => sum + ipStats.total, 0),
    }));
};

// 统计信息
const getStats = (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(requestStats, null, 2));
};

// 请求处理
const handleRequest = async (req, res) => {
    const startTime = Date.now();
    const ip = req.socket.remoteAddress;

    // IP 黑名单
    if (config.blacklistedIPs.includes(ip)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 禁止访问：您的 IP 已被列入黑名单');
        logger.warn(`[黑名单 IP] ${ip}`);
        return;
    }

    // IP 白名单
    if (config.whitelistedIPs.length > 0 && !config.whitelistedIPs.includes(ip)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 禁止访问：您的 IP 不在白名单中');
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const route = url.pathname;

    if (route === '/health') {
        healthCheck(req, res);
        return;
    }

    if (route === '/stats') {
        getStats(req, res);
        return;
    }

    const handler = apiHandlersCache[route];
    if (handler) {
        try {
            logger.info(`[请求日志] IP:${ip} 路由:${route}`);
            updateRequestStats(ip, route);

            if (config.cors.enabled) {
                res.setHeader('Access-Control-Allow-Origin', config.cors.origin);
            }
            res.setHeader('Content-Type', 'application/json; charset=utf-8');

            await handler(req, res);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`500 服务器内部错误：${err.message}`);
            logger.error(`[API错误] 路由: ${route} 错误: ${err.message}`);
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 未找到：接口不存在');
        logger.warn(`[404] 路由不存在: ${route}`);
    }

    const endTime = Date.now();
    logger.info(`[请求完成] IP: ${ip} 路由: ${route} 响应时间: ${endTime - startTime}ms`);
};

// 启动服务
const startServer = async () => {
    const startTime = Date.now();
    const files = await fs.readdir(path.join(Plugin_Path, 'server', 'api'));
    for (const file of files) {
        if (file.endsWith('.js')) {
            await loadApiHandler(path.join(Plugin_Path, 'server', 'api', file));
        }
    }
    loadStats.totalTime = Date.now() - startTime;

    logger.info(chalk.green('MEMZ-API服务载入完成'));
    logger.info(chalk.greenBright(`成功加载：${loadStats.success} 个`));
    logger.info(chalk.yellowBright(`加载失败：${loadStats.failure} 个`));
    logger.info(chalk.cyanBright(`总耗时：${loadStats.totalTime} 毫秒`));

    const server = http.createServer((req, res) => handleRequest(req, res));
    server.listen(config.port, () => {
        logger.info(`[memz-plugin]API服务器已启动: http://127.0.0.1:${config.port}`);
    });

    return server;
};

export default startServer;
