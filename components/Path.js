import path from "path";
const Path = process.cwd();
const Plugin_Name = "memz-plugin";
const Plugin_Path = path.join(Path, "plugins", Plugin_Name);
const Plugin_Temp = path.join(Plugin_Path, "temp");
export { Path, Plugin_Name, Plugin_Path, Plugin_Temp };
