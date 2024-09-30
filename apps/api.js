// import fs from 'fs';
// import yaml from 'js-yaml';
// import axios from 'axios';

// const configFilePath = './plugins/memz-plugin/config/config/api-config.yaml';

// // 读取配置文件
// async function loadConfig() {
//     const fileContent = fs.readFileSync(configFilePath, 'utf8');
//     return yaml.load(fileContent);
// }

// // 发送请求
// async function sendRequest(url, method, data = null) {
//     const options = {
//         method,
//         url,
//         ...(method.toLowerCase() === 'post' && { data }),
//     };

//     try {
//         const response = await axios(options);
//         return response.data;
//     } catch (error) {
//         throw new Error(`请求失败: ${error.response?.status} ${error.response?.statusText} - ${error.message}`);
//     }
// }

// export class ApiPlugin extends plugin {
//     constructor() {
//         super({
//             name: 'API插件',
//             dsc: '根据配置文件调用API并返回结果',
//             event: 'message',
//             priority: 1,
//             rule: []
//         });

//         this.configs = [];
//         this.init(); // 在构造函数中调用初始化
//     }

//     async init() {
//         this.configs = await loadConfig();
//         await this.setupRules(); // 仅在初始化时调用
//     }

//     async setupRules() {
//         this.rule = []; // 仅在这里重置
//         for (const apiGroup of Object.values(this.configs)) {
//             apiGroup.forEach(api => {
//                 this.rule.push({
//                     reg: new RegExp(api.reg),
//                     fnc: 'handleApiRequest',
//                     apiConfig: api
//                 });
//             });
//         }
//     }

//     async handleApiRequest(e, rule) {
//         rule = rule;
//         const apiConfig = this.rule.find(rule => {
//             console.log(`Testing rule: ${rule.reg} against message: ${e.msg}`);
//             return rule.reg.test(e.msg);
//         });

//         if (!apiConfig) {
//             console.log("No matching rule found.");
//             return;
//         }

//         const { url, method } = apiConfig.apiConfig;

//         try {
//             const result = await sendRequest(url, method);
//             await this.sendResponse(e, apiConfig.apiConfig, result);
//         } catch (error) {
//             await e.reply(`请求失败: ${error.message}`, true);
//         }
//     }
//     async sendResponse(e, apiConfig, result) {
//         const { name } = apiConfig;

//         try {
//             switch (name) {
//                 case 'TextApi':
//                     if (apiConfig.method.toLowerCase() === 'get') {
//                         e.reply([segment.text(result)], true); // 处理文本结果
//                     }
//                     break;

//                 case 'ImageAPI':
//                     e.reply([segment.image(result)], true);
//                     break;

//                 case 'VoiceAPI':
//                     if (result.voice) {
//                         e.reply([segment.record(result)], true);
//                     }
//                     break;

//                 case 'VideoAPI':
//                     if (result.video) {
//                         e.reply([segment.video(result)], true);
//                     }
//                     break;

//                 case 'MusicAPI':
//                     if (result.music) {
//                         e.reply([segment.music(result)], true);
//                     }
//                     break;

//                 default:
//                     e.reply([segment.json(result)], true); // 默认使用 JSON 格式
//                     break;
//             }
//         } catch (replyError) {
//             console.error(`发送响应失败: ${replyError.message}`);
//         }
//     }
// }
