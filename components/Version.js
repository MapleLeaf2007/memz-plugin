import fs from "fs";
import lodash from "lodash";
import { Plugin_Path } from "./Path.js";
let packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

const getLine = function (line) {
  line = line.replace(/(^\s*\*|\r)/g, "");
  line = line.replace(/\s*`([^`]+`)/g, '<span class="cmd">$1');
  line = line.replace(/`\s*/g, "</span>");
  line = line.replace(/\s*\*\*([^*]+\*\*)/g, '<span class="strong">$1');
  line = line.replace(/\*\*\s*/g, "</span>");
  line = line.replace(/ⁿᵉʷ/g, '<span class="new"></span>');
  return line;
};

const readLogFile = function (root) {
  const logPath = `${root}/CHANGELOG.md`;
  const changelogs = [];
  let currentVersion;

  try {
    if (fs.existsSync(logPath)) {
      let logs = fs.readFileSync(logPath, "utf8") || "";
      logs = logs.split("\n");

      let temp = {};
      let lastLine = {};

      lodash.forEach(logs, (line) => {
        // 匹配版本行
        const versionRet = /^#\s*([0-9a-zA-Z\\.~\s]+?)\s*$/.exec(line);
        if (versionRet && versionRet[1]) {
          const v = versionRet[1].trim();

          if (!currentVersion) {
            currentVersion = v;
          } else {
            changelogs.push(temp); // 保存上一个版本的日志
          }

          temp = {
            version: v,
            logs: [],
          };
        } else {
          // 如果不是版本行，处理日志内容
          if (!line.trim()) return;

          if (/^\*/.test(line)) { // 主条目
            lastLine = {
              title: getLine(line),
              logs: [],
            };
            temp.logs.push(lastLine);
          } else if (/^\s{2,}\*/.test(line)) { // 子条目
            lastLine.logs.push(getLine(line));
          }
        }
      });

      // 处理最后一个版本的日志
      if (Object.keys(temp).length) {
        changelogs.push(temp);
      }
    }
  } catch (e) {
    logger.error("Error reading log file:", e);
  }

  return { changelogs, currentVersion };
};

const { changelogs, currentVersion } = readLogFile(`${Plugin_Path}/`);

const yunzaiVersion = packageJson.version;
const isMiao = !!packageJson.dependencies.sequelize;
const isTrss = !!Array.isArray(Bot.uin);

let Version = {
  isMiao,
  isTrss,
  get version() {
    return currentVersion;
  },
  get yunzai() {
    return yunzaiVersion;
  },
  get changelogs() {
    return changelogs;
  },
  readLogFile,
};

export default Version;
