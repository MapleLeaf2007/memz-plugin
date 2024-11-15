// import Redis from "ioredis";
// import { Config } from "../components/index.js";
// const { apply_game } = Config.getConfig("memz");
// const getTime = () => {
//   const now = new Date();
//   return now
//     .toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })
//     .replace(",", "");
// };

// const redis = new Redis();

// export class Game extends plugin {
//   constructor() {
//     super({
//       name: "游戏申请管理",
//       dsc: "管理游戏的申请、取消和查看",
//       event: "message",
//       priority: 100,
//       rule: [
//         {
//           reg: /^#申请游戏\s*(.+)$/,
//           fnc: "applyGame",
//         },
//         {
//           reg: /^#取消申请游戏\s*(.+)$/,
//           fnc: "cancelGame",
//         },
//         {
//           reg: /^#我的游戏申请$/,
//           fnc: "listMyApplications",
//         },
//         {
//           reg: /^#查看所有游戏申请$/,
//           fnc: "listAllApplications",
//         },
//       ],
//     });
//   }

//   async applyGame(e) {
//     if (!apply_game && !e.isMaster)
//       return logger.warn("[memz-plugin]申请游戏状态当前为关闭");
//     const match = e.msg.match(/^#申请游戏\s*(.+)$/);
//     if (!match || match.length < 2) {
//       e.reply(`命令格式错误，请使用#申请游戏 <游戏名称>。`, true);
//       return;
//     }

//     const gameName = match[1].trim();
//     const userId = e.user_id;
//     const beijingTime = getTime();
//     const userKey = `User:${userId}:Games`;
//     const maxApplications = 5;

//     try {
//       const isAlreadyApplied = await redis.sismember(userKey, gameName);
//       if (isAlreadyApplied) {
//         e.reply(`您已经申请过游戏(${gameName})，请不要重复申请。`, true);
//         return;
//       }

//       const currentCount = await redis.scard(userKey);
//       if (currentCount >= maxApplications) {
//         e.reply(
//           `您已经达到申请游戏的上限（${maxApplications}个），请先取消一些申请后再继续。`,
//           true,
//         );
//         return;
//       }

//       const data = {
//         gameId: gameName,
//         userId: userId,
//         timestamp: beijingTime,
//       };

//       await redis.sadd(userKey, gameName);
//       await redis.hset(
//         "GameApplications",
//         `${userId}:${gameName}`,
//         JSON.stringify(data),
//       ); // 使用Hash存储详细信息
//       e.reply(`游戏(${gameName})申请成功，请等待审核。`, true);
//     } catch (error) {
//       console.error(`申请游戏失败: ${error}`);
//       e.reply(`申请失败: ${error}`, true);
//     }
//   }

//   async cancelGame(e) {
//     const match = e.msg.match(/^#取消申请游戏\s*(.+)$/);
//     if (!match || match.length < 2) {
//       e.reply(`命令格式错误，请使用#取消申请游戏 <游戏名称>。`, true);
//       return;
//     }

//     const gameName = match[1].trim();
//     const userId = e.user_id;
//     const userKey = `User:${userId}:Games`;

//     try {
//       const isApplied = await redis.sismember(userKey, gameName);
//       if (!isApplied) {
//         e.reply(`您未申请过游戏(${gameName})，无法取消。`, true);
//         return;
//       }

//       await redis.srem(userKey, gameName);
//       await redis.hdel("GameApplications", `${userId}:${gameName}`);

//       e.reply(`游戏(${gameName})的申请已取消。`, true);
//     } catch (error) {
//       console.error(`取消申请失败: ${error}`);
//       e.reply(`取消申请失败: ${error}`, true);
//     }
//   }

//   async listMyApplications(e) {
//     const userId = e.user_id;
//     const userKey = `User:${userId}:Games`;

//     try {
//       const gameIds = await redis.smembers(userKey);
//       if (gameIds.length === 0) {
//         e.reply(`您当前没有任何游戏申请。`, true);
//         return;
//       }

//       const applicationDetails = [];
//       for (const gameId of gameIds) {
//         const application = await redis.hget(
//           "GameApplications",
//           `${userId}:${gameId}`,
//         );
//         if (application) {
//           const parsedApp = JSON.parse(application);
//           applicationDetails.push(
//             `游戏ID: ${parsedApp.gameId}, 申请时间: ${parsedApp.timestamp}`,
//           );
//         }
//       }

//       const response =
//         applicationDetails.length > 0
//           ? `您已申请的游戏列表如下：\n${applicationDetails.join("\n")}`
//           : `您当前没有任何游戏申请。`;

//       e.reply(response, true);
//     } catch (error) {
//       console.error(`获取申请列表失败: ${error}`);
//       e.reply(`获取申请列表失败: ${error}`, true);
//     }
//   }

//   async listAllApplications(e) {
//     try {
//       const applications = await redis.hgetall("GameApplications");
//       const applicationArray = Object.values(applications).map((app) =>
//         JSON.parse(app),
//       );

//       if (applicationArray.length === 0) {
//         e.reply(`当前没有任何游戏申请记录。`, true);
//         return;
//       }

//       const applicationDetails = applicationArray
//         .map((app) => {
//           return `用户ID: ${app.userId}, 游戏ID: ${app.gameId}, 申请时间: ${app.timestamp}`;
//         })
//         .join("\n");

//       e.reply(`所有游戏申请列表如下：\n${applicationDetails}`, true);
//     } catch (error) {
//       console.error(`获取所有申请列表失败: ${error}`);
//       e.reply(`获取所有申请列表失败: ${error}`, true);
//     }
//   }
// }
