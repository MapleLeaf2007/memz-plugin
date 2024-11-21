import puppeteer from 'puppeteer'
import { Config } from '../components/index.js'
import dns from 'dns'
import net from 'net'

export class PingScreenshot extends plugin {
  constructor () {
    super({
      name: '[memz-plugin]Ping截图',
      dsc: 'MEMZ-Plugin-Ping',
      event: 'message',
      priority: 1,
      rule: [
        {
          reg: '^#(http|ping|tcping)\\s*(\\S+)$',
          fnc: 'ping'
        }
      ]
    })
  }

  async ping (e) {
    const { PingAll, PingApi } = Config.getConfig('memz')
    if (!PingAll && !e.isMaster) {
      return logger.warn('[memz-plugin]Ping功能当前为仅主人可用')
    }
    if (PingApi === 1) {
      logger.debug('PingApi 是 1，执行 Zhalema 函数')
      await this.Zhalema(e)
    } else if (PingApi === 2) {
      logger.debug('PingApi 是 2，执行 ipinfo 函数')
      await this.ipinfo(e)
    } else {
      logger.error('PingApi 配置错误！')
    }
  }

  async ipinfo (e) {
    const { IpinfoToken } = Config.getConfig('memz')
    const match = e.msg.match(/^#(http|ping|tcping)\s*(\S+)$/i)
    if (!match) {
      logger.warn('未匹配到正确的Ping命令')
      return await e.reply('请输入正确的Ping命令', true)
    }

    const [, type, siteName] = match

    logger.debug(`解析的命令类型: ${type}, 目标: ${siteName}`)

    if (type === 'http' || type === 'tcping') {
      return await e.reply(`选择 IpInfo 暂时不支持 ${type} 命令`, true)
    }

    if (!IpinfoToken) {
      e.reply('请前往 https://ipinfo.io 注册账号并获取 Token 后在配置文件中配置', true)
      return false
    }

    let ipAddress = siteName
    if (!net.isIPv4(siteName) && !net.isIPv6(siteName)) {
      ipAddress = await this.resolveDomainToIp(siteName)
      if (!ipAddress) {
        await e.reply('无法解析域名的IP地址！', e.isGroup)
        return false
      }
    }

    try {
      const ipInfo = await fetch(`https://ipinfo.io/${ipAddress}?token=${IpinfoToken}`)
        .then(response => response.json())
        .catch(error => {
          throw new Error(`IP信息获取失败: ${error.message}`)
        })

      if (ipInfo.bogon) {
        await e.reply('目标地址为 Bogon IP（私有IP）。')
      }

      let res = `IP: ${ipInfo.ip}\n国家/地区：${ipInfo.country}\n区域：${ipInfo.region}\n城市：${ipInfo.city}\n时区：${ipInfo.timezone}\n经纬度：${ipInfo.loc}\n运营商：${ipInfo.org}`
      await e.reply(res)
      return true
    } catch (error) {
      logger.error(`获取 IP 信息出错: ${error}`)
      await e.reply(`获取 IP 信息出错: ${error.message}`)
    }
  }

  async resolveDomainToIp (domain) {
    return new Promise((resolve, reject) => {
      dns.lookup(domain, (err, address) => {
        if (err) {
          reject(err)
        } else {
          resolve(address)
        }
      })
    }).catch((err) => {
      logger.error(`域名解析出错: ${err.message}`)
      return null
    })
  }

  async Zhalema (e) {
    const { PingProxy, PingProxyAddress } = Config.getConfig('memz')
    e.reply('正在获取Ping数据...请稍等......', true)

    const match = e.msg.match(/^#(http|ping|tcping)\s*(\S+)$/i)
    if (!match) {
      logger.warn('未匹配到正确的Ping命令')
      return await e.reply('请输入正确的Ping命令', true)
    }

    const [, type, siteName] = match
    logger.debug(`解析的命令类型: ${type}, 目标: ${siteName}`)

    const url = `https://zhale.me/${type}/?{"Target":"${siteName}","Options":{"ISPs":["移动","电信","联通","海外"],"Method":"GET","ParseMode":"default","SkipSSLVerify":false,"FollowRedirect":true},"IsContinue":false}`
    logger.debug(`[MEMZ-Plugin] 构造的目标 URL: ${url}`)

    const launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }

    if (PingProxy && PingProxyAddress) {
      launchOptions.args.push(`--proxy-server=${PingProxyAddress}`)
      logger.debug(`[MEMZ-Plugin] 使用代理: ${PingProxyAddress}`)
    }

    logger.debug('启动 Puppeteer 浏览器...')
    const browser = await puppeteer.launch(launchOptions)
    const page = await browser.newPage()
    logger.debug('已创建新页面')

    try {
      logger.debug(`导航到目标页面: ${url}`)
      await page.goto(url, { waitUntil: 'networkidle2' })

      logger.debug('开始等待加载进度条...')
      let progress = 0
      const progressSelector = '.process-bar'

      while (progress < 100) {
        try {
          logger.debug('等待进度条元素...')
          await page.waitForSelector(progressSelector, { timeout: 5000 })

          progress = await page.evaluate((selector) => {
            const progressElement = document.querySelector(selector)
            if (progressElement) {
              const width = progressElement.style.width
              if (width) {
                const match = width.match(/(\d+)%/)
                if (match) {
                  return parseInt(match[1], 10)
                }
              }
            }
            return 0
          }, progressSelector)

          logger.debug(`当前进度: ${progress}%`)
          if (progress >= 100) {
            logger.debug('加载完成，进度达到100%')
            break
          }
        } catch (err) {
          logger.warn('进度条元素未找到或提取失败，继续重试...')
        }

        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      logger.debug('设置页面视口大小...')
      await page.setViewport({ width: 1420, height: 1000 })

      logger.debug('开始截图...')
      const clipOptions = {
        x: 95,
        y: 420,
        width: 1245,
        height: 1000
      }

      logger.debug(
        `截图区域 - x: ${clipOptions.x}, y: ${clipOptions.y}, width: ${clipOptions.width}, height: ${clipOptions.height}`
      )

      const screenshot = await page.screenshot({ encoding: 'base64', clip: clipOptions })
      logger.debug('截图成功，发送截图')

      await e.reply(segment.image(`base64://${screenshot}`), true)
    } catch (error) {
      logger.error(`Error in Zhalema: ${error.stack}`)
      await e.reply(`无法获取网页截图: ${error.message}`, true)
    } finally {
      logger.debug('关闭浏览器')
      await browser.close()
      logger.debug('退出 Zhalema 函数')
    }
  }
}
