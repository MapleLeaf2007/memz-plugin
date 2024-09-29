import sharp from 'sharp';
import { BrowserQRCodeReader } from '@zxing/library';

if (!global.拆分消息) {
  global.拆分消息 = async function 拆分消息(messages, e, sl = 100) {
    if (!Array.isArray(messages)) {
      messages = [messages];
    }
    const chunkArray = function chunkArray(array, chunkSize) {
      const result = [];
      for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        result.push(chunk);
      }
      return result;
    };
    const batches = chunkArray(messages, sl);
    for (const batch of batches) {
      await e.reply(e.runtime.common.makeForwardMsg(e, batch));
    }
  };
}

export class QRCodeReaderPlugin extends plugin {
  constructor() {
    super({
      name: '二维码读取',
      dsc: '读取二维码链接',
      event: 'message',
      priority: 6,
      rule: [
        {
          reg: /^#?读取二维码/i,
          fnc: 'readQRCodeHandler'
        }
      ]
    });
  }

  async readQRCodeHandler(e) {
    const imageUrl = e.msg.match(/^#?读取二维码\s*(.+)?$/i)[1];

    try {
      let images = [];
      let ljs = [];
      let isImage = false;
      let message;

      if (e.source) {
        logger.info(e.source.seq);
        if (e.isGroup) {
          message = await (await e.group.getChatHistory(e.source.seq, 1)).pop();
        } else {
          message = await (await e.friend.getChatHistory(e.source.time, 1)).pop();
        }
      } else {
        message = e.message;
      }

      if (!Array.isArray(message)) {
        message = [message];
      }

      let fms;
      for (const msgs of message) {
        if (msgs.type === 'image') {
          images.push(msgs.url);
          isImage = true;
        }
        if (msgs.type === 'json') {
          try {
            fms = Bot.getForwardMsg(msgs.data);
          } catch (err) {
            logger.error('获取转发消息失败', err);
          }

          if (fms) {
            logger.info('找到了转发消息！');
            for (const key of Object.keys(fms)) {
              const forwardMsg = fms[key].message;
              for (const forwardMsgContent of forwardMsg) {
                if (forwardMsgContent.type === 'image') {
                  logger.info('在转发消息内找到了图片！');
                  images.push(forwardMsgContent.url);
                  isImage = true;
                }
              }
            }
          }
        }
      }

      if (!isImage) images.push(imageUrl);
      logger.info(images);
      if (images.length === 0) return this.reply('你好像没有夹带图片链接/一同发送图片/回复图片');

      for (const url of images) {
        const ewm = await readQRCodeFromUrl(url);
        ljs.push(`二维码内容: ${ewm}\n`);
      }

      await 拆分消息(ljs, this.e);
    } catch (error) {
      await e.reply(`Error: ${error.message}`);
      logger.error(error);
    }
  }
}

async function readQRCodeFromUrl(imageUrl) {
  try {
    // 使用 sharp 处理图像
    const imageBuffer = await sharp(imageUrl)
      .grayscale()  // 转为灰度图像
      .sharpen()    // 增强图像锐度
      .toBuffer();

    const qrReader = new BrowserQRCodeReader();

    return new Promise((resolve, reject) => {
      qrReader.decodeFromImage(undefined, imageBuffer, (err, result) => {
        if (err) {
          reject(new Error('Failed to read QR code'));
        } else {
          resolve(result.text);
        }
      });
    });
  } catch (error) {
    console.error('Error reading QR code:', error);
    throw new Error('Failed to read QR code');
  }
}
