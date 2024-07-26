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
  registrant: '注册人信息',
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

export async function getDetailedWhoisData(domain) {
  try {
    const result = await whois(domain, { timeout: 10000 });
    return result;
  } catch (error) {
    throw new Error(`获取 WHOIS 数据时出错: ${error.message}`);
  }
}

export function translateWhoisData(data) {
  const translatedData = {};
  
  for (const key in data) {
    if (whoisFieldsMap[key]) {
      if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
        translatedData[whoisFieldsMap[key]] = translateWhoisData(data[key]);
      } else {
        translatedData[whoisFieldsMap[key]] = data[key];
      }
    } else {
      translatedData[key] = data[key];
    }
  }
  
  return translatedData;
}

export class Whois extends plugin {
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

  async whois(e) {
    let domain = e.msg.match(/#?whois\s*(.+)/)[1].trim();
    let whoisdata = '';
    try {
      const data = await getDetailedWhoisData(domain);
      const translatedData = translateWhoisData(data);
      for (const key in translatedData) {
        whoisdata += `${key}: ${translatedData[key]}, <br>`;
      }

      let html = fs.readFileSync('plugins/fengye-plugin/resources/html/whois/whois.html', 'utf8')
        .replace('{{whoisdata}}', whoisdata);
      
      const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const page = await browser.newPage();
      await page.setContent(html);
      
      const contentHeight = await page.evaluate(() => {
        return document.documentElement.scrollHeight;
      });
      
      await page.setViewport({ width: 800, height: contentHeight });
      
      const buffer = await page.screenshot();
      await browser.close();
      
      await this.reply(segment.image(buffer), true);
    } catch (error) {
      await this.reply(`错误: ${error.message}`, true); // 修正错误处理
    }
  }
}
    