import Version from "./Version.js";
import YamlReader from "./YamlReader.js";
import Render from "./Render.js";
import Config from "./Config.js";
const MEMZ_NAME = "MEMZ-Plugin";
let BotName = Version.isTrss
  ? "Trss-Yunzai"
  : Version.isMiao
    ? "Miao-Yunzai"
    : "Yunzai-Bot";
import {
  Path,
  Plugin_Path,
  Plugin_Temp,
  Plugin_Data,
  Plugin_Name
} from "./Path.js";
export {
  Version,
  Path,
  YamlReader,
  Config,
  Render,
  Plugin_Name,
  Plugin_Path,
  Plugin_Temp,
  Plugin_Data,
  MEMZ_NAME,
  BotName
};
