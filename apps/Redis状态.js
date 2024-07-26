import fs from 'fs';
import puppeteer from 'puppeteer';
import Redis from 'ioredis';

export class RedisStatus extends plugin {
  constructor() {
    super({
      name: 'Redis状态',
      dsc: 'Redis状态',
      event: 'message',
      priority: 6,
      rule: [
        {
          reg: /^#?redis(状态|统计)/i,
          fnc: 'getRedisInfo'
        }
      ]
    });
  }

  async getRedisInfo(e) {
    if (!e.isMaster) return await e.reply('就凭你也配');

    let qw = e.msg.match(/^#?redis(状态|统计)(\s*;?\s*([^;]*);\s*([^;]*);\s*([^;]*))?/i);

    let redisConfig;
    if (qw && qw[3]) {
      redisConfig = {
        host: qw[3],
        port: parseInt(qw[4], 10),
        password: qw[5] || ''
      };
    } else {
      redisConfig = '本体';
    }

    const redisInstance = redisConfig === '本体' ? redis : new Redis(redisConfig);

    try {
      const info = await redisInstance.info();
      const stats = this.parseRedisInfo(info);

      const hitRate = this.calculateHitRate(stats);
      const dbStats = this.getDbStats(stats);

      const html = this.generateHtml(stats, hitRate, dbStats, redisConfig);

      const screenshotBuffer = await this.generateScreenshot(html);
      await this.reply(segment.image(screenshotBuffer), true);
    } catch (error) {
      await e.reply(`Error fetching Redis info: ${error.message}`);
    } finally {
      if (redisConfig !== '本体') {
        redisInstance.disconnect();
      }
    }
  }

  parseRedisInfo(info) {
    const lines = info.split('\n');
    const stats = {};

    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length === 2) {
        const key = parts[0].trim();
        const value = parts[1].trim();
        stats[key] = value;
      }
    });

    return stats;
  }

  calculateHitRate(stats) {
    const keyspaceHits = parseInt(stats.keyspace_hits, 10);
    const keyspaceMisses = parseInt(stats.keyspace_misses, 10);
    return ((keyspaceHits / (keyspaceHits + keyspaceMisses)) * 100).toFixed(2);
  }

  getDbStats(stats) {
    return Object.entries(stats)
      .filter(([key]) => key.startsWith('db'))
      .map(([key, value]) => {
        const dbInfo = value.split(',').reduce((acc, part) => {
          const [k, v] = part.split('=');
          acc[k] = v;
          return acc;
        }, {});
        return `数据库 ${key}: 键数=${dbInfo.keys}, 过期键数=${dbInfo.expires}, 平均TTL=${dbInfo.avg_ttl}`;
      })
      .join('<br>');
  }

  generateHtml(stats, hitRate, dbStats, redisConfig) {
    return fs.readFileSync('plugins/memz-plugin/resources/html/redis/redis.html', 'utf8')
      .replace('{{occupation}}', (stats.used_memory_peak / stats.used_memory_rss).toFixed(2))
      .replace('{{uptime_in_days}}', stats.uptime_in_days)
      .replace('{{tcp_port}}', stats.tcp_port || redisConfig.port)
      .replace('{{connected_clients}}', stats.connected_clients)
      .replace('{{used_memory_rss}}', (stats.used_memory_rss / 1024 / 1024).toFixed(2))
      .replace('{{used_memory}}', (stats.used_memory / 1024 / 1024).toFixed(2))
      .replace('{{used_memory_peak}}', (stats.used_memory_peak / 1024 / 1024).toFixed(2))
      .replace('{{mem_fragmentation_ratio}}', stats.mem_fragmentation_ratio)
      .replace('{{total_connections_received}}', stats.total_connections_received)
      .replace('{{total_commands_processed}}', stats.total_commands_processed)
      .replace('{{instantaneous_ops_per_sec}}', stats.instantaneous_ops_per_sec)
      .replace('{{keyspace_hits}}', stats.keyspace_hits)
      .replace('{{keyspace_misses}}', stats.keyspace_misses)
      .replace('{{hit_rate}}', hitRate)
      .replace('{{latest_fork_usec}}', stats.latest_fork_usec)
      .replace('{{db_stats}}', dbStats)
      .replace('{{connected_slaves}}', stats.connected_slaves || 'N/A')
      .replace('{{role}}', stats.role || 'N/A')
      .replace('{{total_net_input_bytes}}', (stats.total_net_input_bytes / 1024 / 1024).toFixed(2))
      .replace('{{total_net_output_bytes}}', (stats.total_net_output_bytes / 1024 / 1024).toFixed(2))
      .replace('{{rejected_connections}}', stats.rejected_connections)
      .replace('{{expired_keys}}', stats.expired_keys);
  }

  async generateScreenshot(html) {
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage'
      ]
    });

    let buffer;

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const contentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.setViewport({ width: 800, height: contentHeight });
      buffer = await page.screenshot();
    } catch (error) {
      throw new Error(`Puppeteer screenshot generation failed: ${error.message}`);
    } finally {
      await browser.close();
    }

    return buffer;
  }
}
