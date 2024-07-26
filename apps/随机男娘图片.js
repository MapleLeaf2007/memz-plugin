import axios from 'axios';

const owner = 'Cute-Dress';
const repo = 'Dress';
const githubToken = '';

export class SuiJiNanNiang extends plugin {
    constructor() {
        super({
            name: 'MEMZ刷屏禁言',
            dsc: 'MEMZ刷屏禁言',
            event: 'message',
            priority: 6,
            rule: [
                {
                    reg: '^#?(随机)?男娘图片$',
                    fnc: 'displayRandomImage'
                }
            ]
        })

    }

    async fetchDirectoryContents(path) {
        try {
            const encodedPath = encodeURIComponent(path);
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`, {
                headers: {
                    Authorization: `token ${githubToken}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('获取目录内容时出错：', error);
            return [];
        }
    }

    // 从给定的路径获取所有图片文件
    async getAllImageFilesFromDirectories(path) {
        try {
            const directories = await this.fetchDirectoryContents(path);
            if (!Array.isArray(directories)) {
                console.error('获取到的目录内容不是数组：', directories);
                return [];
            }

            const imageFiles = [];

            for (const item of directories) {
                if (item.type === 'file' && !['.gitignore', 'README.md'].includes(item.name)) {
                    const fileName = item.name.toLowerCase();
                    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.gif')) {
                        imageFiles.push(item.download_url);
                    }
                } else if (item.type === 'dir') {
                    const nestedImageFiles = await this.getAllImageFilesFromDirectories(item.path);
                    imageFiles.push(...nestedImageFiles);
                }
            }

            return imageFiles;
        } catch (error) {
            console.error('获取所有图片文件时出错：', error);
            return [];
        }
    }

    async displayRandomImage(e) {
        try {
            const rootDirectories = await this.fetchDirectoryContents('');
            const randomFolder = rootDirectories[Math.floor(Math.random() * rootDirectories.length)].path;
            const files = await this.getAllImageFilesFromDirectories(randomFolder);

            if (files.length === 0) {
                console.log('随机选取的文件夹中找不到图片。');
                return;
            }
            const randomFile = files[Math.floor(Math.random() * files.length)];
            let buttons = [
                [
                    {
                        text: '再来一张',
                        input: `#随机男娘图片`,
                        send: true,
                    },
                ],
            ];
            e.reply([
                segment.image(randomFile),
                segment.button(...buttons),
            ]);
            return true
        } catch (error) {
            console.error('错误:', error);
        }
    }
}
