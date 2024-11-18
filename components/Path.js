import path from "path";
const Path = process.cwd();
const Plugin_Name = "memz-plugin";
const Plugin_Path = path.join(Path, "plugins", Plugin_Name);
const Plugin_Temp = path.join(Plugin_Path, "temp");
const Plugin_Data = path.join(Plugin_Path, "data");
const MEMZ_API_Server = path.join(Plugin_Path, "server");
const MEMZ_API_Data = path.join(Plugin_Path, "server", "data");
export {
    Path,
    Plugin_Path,
    Plugin_Temp,
    Plugin_Data,
    Plugin_Name,
    MEMZ_API_Server,
    MEMZ_API_Data
};
