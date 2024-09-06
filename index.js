import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { fileURLToPath, pathToFileURL } from 'url';

// 获取当前模块的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appsDir = path.join(__dirname, 'apps');  // 使用绝对路径
const files = fs.readdirSync(appsDir).filter(file => file.endsWith('.js'));

let ret = [];

logger.info(`\n\t${chalk.cyan('「MEMZ插件载入中···」')}`);

files.forEach(file => {
    // 将文件路径转换为 file:// URL 格式
    const filePath = pathToFileURL(path.join(appsDir, file)).href;
    ret.push(import(filePath));
});

// 等待所有导入操作完成
ret = await Promise.allSettled(ret);

let apps = {};

files.forEach((file, i) => {
    const name = path.basename(file, '.js');

    if (ret[i].status !== 'fulfilled') {
        logger.error(`MEMZ插件载入错误：${chalk.red(name)}`);
        logger.error(ret[i].reason);
        return;
    }

    // 动态获取导入模块的默认导出或其他导出
    const moduleExports = ret[i].value;
    const defaultExport = moduleExports?.default || moduleExports[Object.keys(moduleExports)[0]];

    apps[name] = defaultExport;

    // 成功提示
    logger.info(`MEMZ插件成功载入：${chalk.green(name)}`);
});

export { apps };
