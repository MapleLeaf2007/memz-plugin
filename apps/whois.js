import whois from 'whois-json';
import puppeteer from 'puppeteer';
import fs from 'fs';

const whoisFieldsMap = {
  domainName: '域名',
  roid: '注册号',
  domainStatus: '域名状态',
  registrant: '注册人信息',
  registrantContactEmail: '注册人邮箱',
  sponsoringRegistrar: '注册商',
  nameServer: 'DNS 服务器',
  registrationTime: '注册时间',
  expirationTime: '过期时间',
  dnssec: 'DNSSEC',
  domain: '域名',
  registrar: '注册商',
  whois_server: 'WHOIS 服务器',
  referral_url: '推荐 URL',
  updated_date: '更新日期',
  creation_date: '创建日期',
  expiration_date: '过期日期',
  status: '状态',
  nameservers: 'DNS 服务器',
  admin: '管理员信息',
  tech: '技术联系人信息',
  name: '姓名',
  organization: '组织',
  street: '街道',
  city: '城市',
  state: '省/州',
  postal_code: '邮政编码',
  country: '国家',
  phone: '电话',
  fax: '传真',
  email: '电子邮件'
};

/**
 * 获取详细的 Whois 数据
 * @param {string} domain - 要查询的域名
 * @returns {Promise<Object>} - 返回一个 Promise，包含获取到的 Whois 数据对象
 * @throws {Error} - 如果获取 Whois 数据时出错，将抛出一个错误
 */
async function getDetailedWhoisData(domain) {
  try {
    return await whois(domain, { timeout: 10000 });
  } catch (error) {
    throw new Error(`获取 WHOIS 数据时出错: ${error.message}`);
  }
}


/**
 * 将 Whois 数据进行翻译
 * @param {Object} data - 要翻译的 Whois 数据对象
 * @returns {Object} - 返回翻译后的 Whois 数据对象
 */
function translateWhoisData(data) {
  return Object.entries(data).reduce((acc, [key, value]) => {
    const translatedKey = whoisFieldsMap[key] || key;
    acc[translatedKey] = typeof value === 'object' && !Array.isArray(value) ? translateWhoisData(value) : value;
    return acc;
  }, {});
}


class Whois extends plugin {
  constructor() {
    super({
      name: 'Whois',
      dsc: 'Whois',
      event: 'message',
      priority: 6,
      rule: [
        {
          reg: '^#?whois\\s*(.+)',
          fnc: 'whois'
        }
      ]
    });
  }

  /**
 * @async
 * @function whois
 * @param {Object} e - 事件对象，包含消息信息。
 * @returns {Promise<void>} - 一个在函数完成时解析的 Promise。
 * @description 获取给定域名的详细 WHOIS 数据，翻译数据，生成 HTML 报告，对报告进行截图，并作为回复发送。
 */
  async whois(e) {
    const domain = e.msg.match(/#?whois\s*(.+)/)[1].trim();
    try {
      const data = await getDetailedWhoisData(domain);
      const translatedData = translateWhoisData(data);
      const whoisDataHtml = Object.entries(translatedData)
        .map(([key, value]) => `${key}: ${value}`)
        .join('<br>');

      const htmlTemplate = fs.readFileSync('plugins/memz-plugin/resources/html/whois/whois.html', 'utf8');
      const html = htmlTemplate.replace('{{whoisdata}}', whoisDataHtml);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      await page.goto(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`, {
        waitUntil: 'networkidle0'
      });

      const contentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.setViewport({ width: 800, height: contentHeight });

      const buffer = await page.screenshot();
      await browser.close();

      await this.reply(segment.image(buffer), true);
    } catch (error) {
      await this.reply(`错误: ${error.message}`, true);
    }
  }
}

export { Whois, getDetailedWhoisData, translateWhoisData };
