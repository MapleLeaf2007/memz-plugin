import fs from 'node:fs'
import chalk from 'chalk'

const files = fs.readdirSync('./plugins/memz-plugin/apps').filter(file => file.endsWith('.js'))

let ret = []

logger.info(`\t\n\t${chalk.cyan(`「MEMZ插件载入中···」`)}\t\n\t`);
files.forEach((file) => {
    ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
    let name = files[i].replace('.js', '')

    if (ret[i].status != 'fulfilled') {
        logger.error(`MEMZ插件载入错误：${logger.red(name)}`)
        logger.error(ret[i].reason)
        continue
    }
    apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
export { apps }