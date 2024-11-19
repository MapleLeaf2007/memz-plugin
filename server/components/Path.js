import path from "path";
import { Plugin_Path } from "../../components/Path.js";

const MEMZ_API_Server = path.join(Plugin_Path, "server");
const MEMZ_API_Data = path.join(Plugin_Path, "server", "data");

export {
    MEMZ_API_Server,
    MEMZ_API_Data
};