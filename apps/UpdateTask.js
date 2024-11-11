import fetch from "node-fetch";
import cfg from "../../../lib/config/config.js";
import moment from "moment";
import { Config } from "../components/index.js";
const { checkupdate, CUSTOM_REPOSITORY, cron } = Config.getConfig("update-config");

const prefix = "bubble:codeUpdateTask:";
let REPOSITORY_LIST = [];

init();

export class UpdateTask extends plugin {
    constructor() {
        super({
            name: "[memz-plugin]定时检查更新",
            event: "message",
            priority: 1000,
            rule: [
                {
                    reg: /^#?(memz)(插件)?检查(仓库)?更新$/i,
                    fnc: "UpdateTask",
                },
            ],
        });
        this.task = {
            cron: cron,
            name: "[memz-plugin]仓库定时检查更新",
            log: false,
            fnc: () => this.UpdateTask(),
        };
    }

    async UpdateTask(e) {
        if (checkupdate == false) {
            logger.warn("[memz-plugin]仓库定时检查更新已关闭");
            return true;
        }

        // 去重
        REPOSITORY_LIST = Array.from(new Set(REPOSITORY_LIST));
        if (REPOSITORY_LIST.length === 0) {
            logger.warn("未检测到有效的仓库地址");
            return false;
        }

        let content = [];
        let index = -1;

        for (const item of REPOSITORY_LIST) {
            index++;
            if (index > 1) {
                await this.sleep(1000);
            }

            logger.info(`开始检查仓库更新：${item.owner}/${item.repo}`);
            let repositoryData = await this.getRepositoryLatestCommit(item.source, item.owner, item.repo);
            if (!repositoryData?.sha) {
                logger.warn(`未能获取到提交信息：${item.owner}/${item.repo}`);
                continue;
            }

            const redisKey = `${prefix}${item.owner}/${item.repo}`;
            let redisSha = await redis.get(redisKey);
            logger.debug(`Redis中缓存的SHA值：${redisSha}，最新的SHA值：${repositoryData.sha}`);

            if (redisSha && String(redisSha) === String(repositoryData.sha)) {
                logger.info(`仓库 ${item.owner}/${item.repo} 没有新更新`);
                continue;
            }

            await redis.set(redisKey, repositoryData.sha);
            content.push(repositoryData);
        }

        if (content.length > 0) {
            const msg =
                `检测到${content[0].source}仓库更新...\n` +
                content
                    .map(
                        (i) =>
                            `项目名称：${i.owner}/${i.repo}\n开发者名称：${i.author}\n开发者邮箱：${i.email}\n更新信息：${i.message}\n更新时间：${i.date}\n`,
                    )
                    .join("\n");

            const masters = cfg.masterQQ;
            for (const master of masters) {
                if (master.toString().length > 11) continue;
                await Bot.pickFriend(master).sendMsg(msg);
                await this.sleep(2000);
            }
        } else {
            logger.info("未检测到任何仓库更新");
        }
    }
    async getRepositoryLatestCommit(source, owner, repo) {
        if (source === "Gitee") {
            return await this.getGiteeLatestCommit(owner, repo);
        } else if (source === "GitHub") {
            return await this.getGithubLatestCommit(owner, repo);
        } else {
            return { error: "未知的仓库来源" };
        }
    }
    async getGiteeLatestCommit(owner, repo) {
        const apiUrl = `https://gitee.com/api/v5/repos/${owner}/${repo}/commits`;

        try {
            const response = await fetch(apiUrl);
            const commits = await response.json();

            if (commits.length > 0) {
                const latestCommit = commits[0];
                return {
                    source: "Gitee",
                    owner,
                    repo,
                    sha: latestCommit.sha,
                    author: latestCommit.commit.author.name,
                    email: latestCommit.commit.author.email,
                    date: moment(latestCommit.commit.author.date).format(
                        "YYYY-MM-DD HH:mm:ss",
                    ),
                    message: latestCommit.commit.message.trim(),
                };
            } else {
                return { error: "该仓库没有提交记录。" };
            }
        } catch (error) {
            return { error: "查询出错：" + error.message };
        }
    }

    // 获取 GitHub 的提交
    async getGithubLatestCommit(owner, repo) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;

        try {
            const response = await fetch(apiUrl);
            const commits = await response.json();

            if (commits.length > 0) {
                const latestCommit = commits[0];
                return {
                    source: "GitHub",
                    owner,
                    repo,
                    sha: latestCommit.sha,
                    author: latestCommit.commit.author.name,
                    email: latestCommit.commit.author.email,
                    date: moment(latestCommit.commit.author.date).format(
                        "YYYY-MM-DD HH:mm:ss",
                    ),
                    message: latestCommit.commit.message.trim(),
                };
            } else {
                return { error: "该仓库没有提交记录。" };
            }
        } catch (error) {
            return { error: "查询出错：" + error.message };
        }
    }

    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

function init() {
    function gitRemoteUrl(remoteUrl) {
        const urlMatch = remoteUrl.match(
            /^(?:https?:\/\/)?(?:[^/]+\/)+([^/]+)\/([^/]+)(?:\.git)?$/,
        );
        const sshUrlMatch = remoteUrl.match(/^.+@(.+):([^/]+)\/([^/]+)\.git$/);

        if (urlMatch) {
            const owner = urlMatch[1];
            const repo = urlMatch[2].replace(".git", "");
            const source = remoteUrl.includes("gitee") ? "Gitee" : "GitHub";
            REPOSITORY_LIST.push({
                source,
                owner,
                repo,
            });
            logger.debug(`已添加仓库：${source}://${owner}/${repo}`);
        } else if (sshUrlMatch) {
            const owner = sshUrlMatch[2];
            const repo = sshUrlMatch[3];
            const source = remoteUrl.includes("gitee") ? "Gitee" : "GitHub";
            REPOSITORY_LIST.push({
                source,
                owner,
                repo,
            });
            logger.debug(`已添加仓库：${source}://${owner}/${repo}`);
        } else {
            logger.debug(`未识别的仓库地址格式：${remoteUrl}`);
        }
    }

    if (Array.isArray(CUSTOM_REPOSITORY) && CUSTOM_REPOSITORY.length > 0) {
        CUSTOM_REPOSITORY.forEach((item) => {
            gitRemoteUrl(item);
        });
    } else {
        logger.debug("CUSTOM_REPOSITORY 配置为空或未正确读取");
    }

    logger.debug(`[memz-plugin] 初始化完成，仓库列表：${JSON.stringify(REPOSITORY_LIST)}`);
}
