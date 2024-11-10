import { Version, Config } from "../components/index.js";
import { Plugin_Name } from "./index.js";
function scale(pct = 1) {
  let scale = Math.min(2, Math.max(0.5, Config.renderScale / 100));
  pct = pct * scale;
  return `style=transform:scale(${pct})`;
}

const Render = {
  async render(path, params, cfg = { retType: "default", saveId: "" }) {
    let { e } = cfg;
    let BotName = Version.isTrss
      ? "Trss-Yunzai"
      : Version.isMiao
        ? "Miao-Yunzai"
        : "Yunzai-Bot";
    return e.runtime.render(Plugin_Name, path, params, {
      retType: cfg.retType,
      beforeRender({ data }) {
        let pluginName = "";
        if (data.pluginName !== false) {
          pluginName = ` & ${data.pluginName || Plugin_Name}`;
          if (data.pluginVersion !== false) {
            pluginName += `<span class="version">${data.pluginVersion || Version.version}`;
          }
        }
        let resPath = data.pluResPath;
        const layoutPath =
          process.cwd() + `/plugins/${Plugin_Name}/resources/common/layout/`;
        const saveId =
          (cfg.saveId || e?.user_id || data.saveId) +
          "_" +
          Math.random().toString().slice(-6);
        return {
          ...data,
          saveId,
          _res_path: resPath,
          defaultLayout: layoutPath + "default.html",
          elemLayout: layoutPath + "elem.html",
          sys: {
            scale: scale(cfg.scale || 1),
          },
          copyright: `Created By ${BotName}<span class="version">${Version.yunzai}</span>${pluginName}</span>`,
          pageGotoParams: {
            waitUntil: "networkidle2",
          },
        };
      },
    });
  },
};

export default Render;
