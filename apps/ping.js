import puppeteer from "puppeteer";
import { Config } from "../components/index.js";
const { PingAll, PingProxy, PingProxyAddress } = Config.getConfig("memz");

export class PingScreenshot extends plugin {
  constructor() {
    super({
      name: "[memz-plugin]Ping截图",
      dsc: "发送#ping网站或#tcping网站,截图对应页面顶部部分",
      event: "message",
      priority: 1,
      rule: [
        {
          reg: `^#(ping|tcping)\\s*(\\S+)$`,
          fnc: "handlePing",
        },
      ],
    });
  }

  async handlePing(e) {
    logger.debug("进入 handlePing 函数");
    if (!PingAll && !e.isMaster) {
      logger.warn("[memz-plugin]Ping功能当前为仅主人可用");
      return;
    }

    e.reply("正在获取Ping数据...请稍等......", true);

    const match = e.msg.match(/^#(ping|tcping)\s*(\S+)$/i);
    if (!match) {
      logger.warn("未匹配到正确的Ping命令");
      return await e.reply("请输入正确的Ping命令", true);
    }

    const [, type, siteName] = match;
    logger.debug(`解析的命令类型: ${type}, 目标: ${siteName}`);

    const url = `https://www.itdog.cn/${type}/${siteName}`;
    logger.debug(`[MEMZ-Plugin] 构造的目标 URL: ${url}`);

    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (PingProxy && PingProxyAddress) {
      launchOptions.args.push(`--proxy-server=${PingProxyAddress}`);
      logger.debug(`[MEMZ-Plugin] 使用代理: ${PingProxyAddress}`);
    }

    logger.debug("启动 Puppeteer 浏览器...");
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    logger.debug("已创建新页面");

    try {
      logger.debug(`导航到目标页面: ${url}`);
      await page.goto(url, { waitUntil: "networkidle2" });

      logger.debug("等待 '单次测试' 按钮出现...");
      await page.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll("button"));
          return buttons.some((btn) => btn.textContent.includes("单次测试"));
        },
        { timeout: 10000 }
      );
      logger.debug("开始等待加载进度条...");
      let progress = 0;
      const progressSelector = "#complete_progress .progress-bar";

      while (progress < 100) {
        try {
          logger.debug("等待进度条元素...");
          await page.waitForSelector(progressSelector, { timeout: 5000 });

          progress = await page.evaluate((selector) => {
            const progressElement = document.querySelector(selector);
            if (progressElement) {
              const styleWidth = progressElement.style.width;
              const num = parseInt(styleWidth.replace("%", ""), 10);
              return isNaN(num) ? 0 : num;
            }
            return 0;
          }, progressSelector);

          logger.debug(`当前进度: ${progress}%`);
          if (progress >= 100) {
            logger.debug("加载完成，进度达到100%");
            break;
          }
        } catch (err) {
          logger.warn("进度条元素未找到或提取失败，继续重试...");
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }


      logger.debug("设置页面视口大小...");
      await page.setViewport({ width: 1420, height: 1000 });

      logger.debug("开始截图...");
      const clipOptions = {
        x: 140,
        y: 799,
        width: 1245,
        height: 1000,
      };
      logger.debug(
        `截图区域 - x: ${clipOptions.x}, y: ${clipOptions.y}, width: ${clipOptions.width}, height: ${clipOptions.height}`
      );

      const screenshot = await page.screenshot({ encoding: "base64", clip: clipOptions });
      logger.debug("截图成功，发送截图");

      await e.reply(segment.image(`base64://${screenshot}`), true);
    } catch (error) {
      logger.error(`Error in handlePing: ${error.stack}`);
      await e.reply(`无法获取网页截图: ${error.message}`, true);
    } finally {
      logger.debug("关闭浏览器");
      await browser.close();
      logger.debug("退出 handlePing 函数");
    }
  }
}
