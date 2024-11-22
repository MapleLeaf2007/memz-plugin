import xlsx from 'xlsx'
import path from 'node:path'
import fs from 'fs/promises'
import { Config, PluginData } from '../components/index.js'

const folderPath = path.join(PluginData, 'xlsx')

// 加载 Excel 数据
async function loadDataFromExcelFiles () {
  try {
    const files = await fs.readdir(folderPath)
    const data = []

    for (const file of files) {
      if (file.endsWith('.xlsx')) {
        const filePath = path.join(folderPath, file)
        const workbook = xlsx.readFile(filePath)
        const sheet = workbook.Sheets[workbook.SheetNames[0]]

        const headers = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 0 })[0] || []
        const sheetData = xlsx.utils.sheet_to_json(sheet, {
          header: headers,
          defval: '', // 默认值，避免 undefined
          range: 1 // 从第二行开始读取
        })

        data.push(...sheetData)
      }
    }

    return data
  } catch (error) {
    console.error('加载 Excel 文件时发生错误:', error.message)
    return []
  }
}

// 搜索资源
function searchResources (keyword, data) {
  return data.filter((row) => row.关键词.includes(keyword))
}

// 统计分类数量
function countCategories (data) {
  const categoryCount = {}

  data.forEach((row) => {
    const category = row.分类 || '未分类'
    categoryCount[category] = (categoryCount[category] || 0) + 1
  })

  return categoryCount
}

export class ResourceSearchPlugin extends plugin {
  constructor () {
    super({
      name: '资源搜索',
      dsc: '根据关键词搜索名称',
      event: 'message',
      priority: 1,
      rule: [
        {
          reg: '^#?搜资源\\s*(\\S+)$',
          fnc: 'handleSearch'
        },
        {
          reg: '^#?资源(分类|类别)?(统计|数量|总数|总计)$',
          fnc: 'handleCategoryCount'
        }
      ]
    })
    this.init()
  }

  async init () {
    this.data = await loadDataFromExcelFiles()
  }

  async handleSearch (e) {
    const { SearchResource } = Config.getConfig('memz')
    if (!SearchResource) {
      return logger.warn('[memz-plugin]搜资源状态当前为关闭')
    }

    const match = e.msg.match(/^#?搜资源\s*(\S+)$/)
    const keyword = match ? match[1] : null

    if (!keyword) {
      return await e.reply('请输入关键词进行搜索！', true)
    }

    try {
      const results = searchResources(keyword, this.data)
      if (results.length > 0) {
        const forward = results.map((row) => ({
          user_id: e.user_id,
          nickname: e.sender.nickname || '为什么不玩原神',
          message: `名称: ${row.关键词}\n内容: ${row.内容}\n分类: ${row.分类}`
        }))

        forward.push({
          user_id: 382879217,
          nickname: 'ZSY11',
          message: '来源：十一实验室(QQ群632226555)\n官网：https://zsy11.com'
        })

        const nmsg = await Bot.makeForwardMsg(forward)
        await e.reply(nmsg)
      } else {
        await e.reply('没有找到你想要的哦~', true)
      }
    } catch (error) {
      console.error('搜索过程中发生错误:', error)
      await e.reply(`搜索过程中发生错误：${error.message}`, true)
    }
  }

  async handleCategoryCount (e) {
    try {
      const categoryCount = countCategories(this.data)
      let message = '----资源分类统计----\n'

      for (const [category, count] of Object.entries(categoryCount)) {
        message += `${category}: ${count} 个资源\n`
      }

      await e.reply(message)
    } catch (error) {
      console.error('统计过程中发生错误:', error)
      await e.reply(`统计过程中发生错误：${error.message}`, true)
    }
  }
}
