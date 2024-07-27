import puppeteer from 'puppeteer';
export class WebmasterToolbox extends plugin {
    constructor() {
        super({
            name: 'WebmasterToolbox',
            dsc: '站长工具箱',
            event: 'message',
            priority: 5,
            rule: [
                {
                    reg: '^#seo分析\\s*(.+)',
                    fnc: 'seoAnalysis'
                },
                {
                    reg: '^#速度测试\\s*(.+)',
                    fnc: 'speedTest'
                },
                {
                    reg: '^#移动端优化检测\\s*(.+)',
                    fnc: 'mobileOptimizationCheck'
                }
            ]
        });
    }

    async seoAnalysis(e) {
        let url = e.msg.match(/#seo分析\s*(.+)/)[1].trim();
        try {
            const seoData = this.mockSeoAnalysis(url);
            let result = `SEO 分析结果:\n`;
            for (let key in seoData) {
                result += `${key}: ${seoData[key]}\n`;
            }
            await this.reply(result);
        } catch (error) {
            await this.reply(`错误: ${error.message}`);
        }
    }

    mockSeoAnalysis(url) {
        return {
            '标题': `标题 for ${url}`,
            '描述': `描述 for ${url}`,
            '关键字': `关键字 for ${url}`,
            '页面速度': '良好',
            '移动友好性': '通过'
        };
    }

    async speedTest(e) {
        let url = e.msg.match(/#速度测试\s*(.+)/)[1].trim();
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            const start = new Date().getTime();
            await page.goto(url, { waitUntil: 'networkidle2' });
            const end = new Date().getTime();
            const loadTime = end - start;
            await browser.close();
            await this.reply(`网站加载时间: ${loadTime}ms`);
        } catch (error) {
            await this.reply(`错误: ${error.message}`);
        }
    }

    async mobileOptimizationCheck(e) {
        let url = e.msg.match(/#移动端优化检测\s*(.+)/)[1].trim();
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setViewport({ width: 375, height: 667, isMobile: true });
            await page.goto(url, { waitUntil: 'networkidle2' });
            const content = await page.content();
            await browser.close();
            const dom = new JSDOM(content);
            const mobileFriendly = dom.window.document.querySelector('meta[name="viewport"]') !== null;
            await this.reply(`移动端优化检测结果: ${mobileFriendly ? '通过' : '不通过'}`);
        } catch (error) {
            await this.reply(`错误: ${error.message}`);
        }
    }
}
