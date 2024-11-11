import os from "os";
import si from "systeminformation";
import { exec } from "child_process";
import { promisify } from "util";
import { Config } from "../components/index.js";
const { SystemStatusAll } = Config.getConfig("memz-config");
const execAsync = promisify(exec);

export class SystemStatus extends plugin {
  constructor() {
    super({
      name: "系统状态",
      dsc: "系统状态",
      event: "message",
      priority: 6,
      rule: [
        {
          reg: /^#(?:memz)?(?:插件)?系统状态(?:pro(max)?)?$/i,
          fnc: "getSystemStatus",
        },
      ],
    });
  }

  async handleMasterCheck(e) {
    if (!SystemStatusAll && !e.isMaster) {
      logger.warn("[memz-plugin]系统状态当前为仅主人可用");
      return false;
    }
    return true;
  }

  async getSystemStatus(e) {
    if (!(await this.handleMasterCheck(e))) return;

    // 判断匹配的模式，选择相应的处理函数
    const match = e.raw_message.match(
      /^#(?:memz)?(?:插件)?系统状态(?:pro(max)?)?$/i,
    );
    const mode =
      match && match[1]
        ? "max"
        : match && match[0].includes("pro")
          ? "extended"
          : "basic";

    try {
      switch (mode) {
        case "basic":
          await this.getSystemInfo(e);
          break;
        case "extended":
          await this.getExtendedSystemInfo(e);
          break;
        case "max":
          await this.getMaxExtendedSystemInfo(e);
          break;
      }
    } catch (error) {
      await e.reply(`获取系统状态信息时出错: ${error.message}`);
    }
  }

  async getSystemInfo(e) {
    if (!(await this.handleMasterCheck(e))) return;
    try {
      const info = await this.basicInfo(e);
      await e.reply(info);
    } catch (error) {
      await e.reply(`获取系统信息时出错: ${error.message}`);
    }
  }

  async getExtendedSystemInfo(e) {
    if (!(await this.handleMasterCheck(e))) return;
    try {
      const [
        basicInfo,
        additionalInfo,
        gpuInfo,
        batteryInfo,
        processInfo,
        networkConnections,
      ] = await Promise.all([
        this.basicInfo(e),
        this.getAdditionalSystemInfo(),
        this.getGPUInfo(),
        this.getBatteryInfo(),
        this.getProcessInfo(),
        this.getNetworkConnections(),
      ]);

      const responses = [
        basicInfo,
        additionalInfo,
        gpuInfo,
        batteryInfo,
        processInfo,
        networkConnections,
      ].filter((info) => info && info.trim() !== "");

      await e.reply(responses.join("\n"));
    } catch (error) {
      await e.reply(`获取扩展系统信息时出错: ${error.message}`);
    }
  }

  async getMaxExtendedSystemInfo(e) {
    if (!(await this.handleMasterCheck(e))) return;
    try {
      const [
        basicInfo,
        additionalInfo,
        gpuInfo,
        batteryInfo,
        processInfo,
        networkConnections,
        diskDetailedInfo,
        serviceDetails,
        motherboardInfo,
        ramInfo,
      ] = await Promise.all([
        this.basicInfo(e),
        this.getAdditionalSystemInfo(),
        this.getGPUInfo(),
        this.getBatteryInfo(),
        this.getProcessInfo(),
        this.getNetworkConnections(),
        this.getDiskDetailedInfo(),
        this.getServiceDetails(),
        this.getMotherboardInfo(),
        this.getRamInfo(),
      ]);

      const responses = [
        basicInfo,
        additionalInfo,
        gpuInfo,
        batteryInfo,
        processInfo,
        networkConnections,
        diskDetailedInfo,
        serviceDetails,
        motherboardInfo,
        ramInfo,
      ].filter((info) => info && info.trim() !== "");

      await e.reply(responses.join("\n"));
    } catch (error) {
      await e.reply(`获取最大扩展系统信息时出错: ${error.message}`);
    }
  }

  async basicInfo(e) {
    try {
      const [osInfo, cpuInfo, currentLoad, memoryInfo] = await Promise.all([
        si.osInfo(),
        si.cpu(),
        si.currentLoad(),
        si.mem(),
      ]);

      const systemArchitecture = `${osInfo.distro} ${osInfo.release} ${osInfo.arch}`;
      const cpuUsage = `${currentLoad.currentLoad.toFixed(2)}%`;
      const cpuSpeed = cpuInfo.speed ? `${cpuInfo.speed} GHz` : null;
      const cpuDetails = `${cpuInfo.physicalCores}核 ${cpuInfo.brand}`;
      const usedMemoryGiB = (memoryInfo.active / 1024 / 1024 / 1024).toFixed(2);
      const totalMemoryGiB = (memoryInfo.total / 1024 / 1024 / 1024).toFixed(2);
      const memoryUsagePercent = `${((memoryInfo.active / memoryInfo.total) * 100).toFixed(2)}%`;
      const memoryUsage = `${usedMemoryGiB} GiB / ${totalMemoryGiB} GiB (${memoryUsagePercent})`;

      const swapUsage =
        memoryInfo.swaptotal > 0
          ? `${((memoryInfo.swaptotal - memoryInfo.swapfree) / 1024 / 1024 / 1024).toFixed(2)} GiB / ${(memoryInfo.swaptotal / 1024 / 1024 / 1024).toFixed(2)} GiB`
          : null;

      let output = `
📊 系统状态

适配器: ${e.adapter_name || `ICQQ`}
操作系统: ${osInfo.platform}
系统架构: ${systemArchitecture}
主机名: ${os.hostname()}
Node.js 版本: ${process.version}
CPU 信息: ${cpuDetails}
CPU 使用率: ${cpuUsage}
内存: ${memoryUsage}
系统运行时间: ${(os.uptime() / 86400).toFixed(2)} 天
            `.trim();

      if (cpuSpeed) output += `\nCPU 频率: ${cpuSpeed}`;
      if (swapUsage) output += `\n内存交换: ${swapUsage}`;

      return output;
    } catch (error) {
      return `获取基本系统信息时出错: ${error.message}`;
    }
  }

  async getAdditionalSystemInfo() {
    try {
      const [diskInfo, cpuTemperature, networkStats, users, services] =
        await Promise.all([
          si.fsSize(),
          si.cpuTemperature(),
          this.getNetworkBandwidth(),
          si.users(),
          si.services(["ssh", "httpd"]),
        ]);

      const diskDetails =
        diskInfo
          .map((disk) => {
            const total = disk.size
              ? `${(disk.size / 1024 / 1024 / 1024).toFixed(2)} GB`
              : null;
            const free = disk.available
              ? `${(disk.available / 1024 / 1024 / 1024).toFixed(2)} GB`
              : null;
            const used = disk.used
              ? `${(disk.used / 1024 / 1024 / 1024).toFixed(2)} GB`
              : null;
            let diskLine = `• ${disk.fs} (${disk.type})`;
            if (total) diskLine += `: 总量 ${total}`;
            if (free) diskLine += `, 可用 ${free}`;
            if (used) diskLine += `, 已用 ${used}`;
            return diskLine;
          })
          .filter((line) => !line.includes("N/A"))
          .join("\n") || null;

      const systemTemperature = cpuTemperature.main
        ? `${cpuTemperature.main} °C`
        : null;
      const networkBandwidth = networkStats || null;
      const loadAvg = os
        .loadavg()
        .map((val) => val.toFixed(2))
        .join(" ");
      const loggedInUsers =
        users.length > 0
          ? users.map((user) => `• ${user.user}`).join("\n")
          : null;
      const serviceStatus =
        services.length > 0
          ? services
            .map(
              (service) =>
                `• ${service.name}: ${service.running ? "✅ Active" : "❌ Inactive"}`,
            )
            .join("\n")
          : null;

      let output = `
💾 磁盘信息
${diskDetails}
📈 系统负载
${loadAvg}
            `.trim();

      if (systemTemperature) output += `\n🌡️ 系统温度: ${systemTemperature}`;
      if (networkBandwidth) output += `\n${networkBandwidth}`;
      if (loggedInUsers) output += `\n👥 登录用户:\n${loggedInUsers}`;
      if (serviceStatus) output += `\n🛠️ 服务状态:\n${serviceStatus}`;

      return output;
    } catch (error) {
      return `获取扩展系统信息时出错: ${error.message}`;
    }
  }

  async getDiskDetailedInfo() {
    try {
      const diskPartitions = await si.diskLayout();
      if (!diskPartitions || diskPartitions.length === 0) {
        return null;
      }

      const partitionsInfo =
        diskPartitions
          .map((partition) => {
            const size = partition.size
              ? `${(partition.size / 1024 ** 3).toFixed(2)} GB`
              : null;
            const name = partition.name || null;
            let partitionLine = `• ${partition.device} - ${partition.type}`;
            if (size) partitionLine += ` - ${size}`;
            if (name) partitionLine += ` - ${name}`;
            return partitionLine;
          })
          .filter((line) => !line.includes("N/A"))
          .join("\n") || null;

      return partitionsInfo ? `📂 磁盘分区详情\n${partitionsInfo}` : null;
    } catch (error) {
      return `获取磁盘分区信息时出错: ${error.message}`;
    }
  }

  async getServiceDetails() {
    try {
      const services = await si.services();
      if (!services || services.length === 0) {
        return null;
      }

      const serviceDetails =
        services
          .map((service) => {
            const status = service.running ? "✅ Active" : "❌ Inactive";
            return `• ${service.name}: ${status}`;
          })
          .filter((line) => !line.includes("N/A"))
          .join("\n") || null;

      return serviceDetails ? `🛠️ 系统服务详情\n${serviceDetails}` : null;
    } catch (error) {
      return `获取系统服务详情时出错: ${error.message}`;
    }
  }

  async getInstalledSoftware() {
    try {
      if (os.platform() === "win32") {
        const { stdout } = await execAsync("wmic product get name,version");
        const lines = stdout
          .split("\n")
          .slice(1)
          .filter((line) => line.trim() !== "");
        const softwareList =
          lines
            .slice(0, 10)
            .map((line) => {
              const [name, version] = line.trim().split(/\s{2,}/);
              return `• ${name || "未知软件"} - 版本: ${version || "N/A"}`;
            })
            .filter((line) => !line.includes("N/A"))
            .join("\n") || null;

        return softwareList
          ? `🖥️ 已安装的软件列表 (Windows，仅显示前10项)\n\n${softwareList}`
          : null;
      } else if (os.platform() === "linux") {
        const { stdout } = await execAsync("dpkg --get-selections");
        const lines = stdout.split("\n").filter((line) => line.trim() !== "");
        const softwareList =
          lines
            .slice(0, 10)
            .map((line) => {
              const [name, status] = line.trim().split(/\s+/);
              return `• ${name} - 状态: ${status}`;
            })
            .filter((line) => !line.includes("N/A"))
            .join("\n") || null;

        return softwareList
          ? `🖥️ 已安装的软件列表 (Linux，仅显示前10项)\n\n${softwareList}`
          : null;
      } else {
        return null;
      }
    } catch (error) {
      return `获取已安装的软件列表时出错: ${error.message}`;
    }
  }

  async getMotherboardInfo() {
    try {
      const motherboard = await si.baseboard();
      if (!motherboard || Object.keys(motherboard).length === 0) {
        return null;
      }

      const manufacturer = motherboard.manufacturer || null;
      const product = motherboard.product || null;
      const version = motherboard.version || null;
      const serial = motherboard.serial || null;

      let info = "";
      if (manufacturer) info += `• 生产商: ${manufacturer}\n`;
      if (product) info += `• 产品: ${product}\n`;
      if (version) info += `• 版本: ${version}\n`;
      if (serial) info += `• 序列号: ${serial}\n`;

      return info ? `🖥️ 主板信息\n${info.trim()}` : null;
    } catch (error) {
      return `获取主板信息时出错: ${error.message}`;
    }
  }

  async getRamInfo() {
    try {
      const ramData = await si.memLayout();

      if (ramData.length === 0) {
        return null;
      }

      const memoryDetails =
        ramData
          .map((ram, index) => {
            const type = ram.type || "未知类型";
            const size = ram.size
              ? `${(ram.size / 1024 / 1024 / 1024).toFixed(2)} GB`
              : "未知大小";
            const speed = ram.speed ? `${ram.speed} MHz` : "未知频率";
            return `• 内存条 ${index + 1}: ${type}, ${size}, ${speed}`;
          })
          .filter((line) => !line.includes("N/A"))
          .join("\n") || null;

      return memoryDetails ? `💾 RAM 信息\n${memoryDetails}` : null;
    } catch (error) {
      return `获取 RAM 信息时出错: ${error.message}`;
    }
  }

  async getGPUInfo() {
    try {
      const gpuData = await si.graphics();

      if (
        !gpuData ||
        !gpuData.controllers ||
        gpuData.controllers.length === 0
      ) {
        return null;
      }

      const gpuDetails =
        gpuData.controllers
          .map((gpu) => {
            const model = gpu.model || "未知型号";
            const vendor = gpu.vendor || "未知供应商";
            const memoryTotal = gpu.memoryTotal
              ? `${gpu.memoryTotal} MB`
              : "未知显存";
            return `• ${model} - ${vendor} - ${memoryTotal}`;
          })
          .filter((line) => !line.includes("N/A"))
          .join("\n") || null;

      // 获取 GPU 负载（仅适用于 NVIDIA GPU）
      let gpuLoadInfo = "";
      if (os.platform() === "linux") {
        try {
          const { stdout } = await execAsync(
            "nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits",
          );
          const loads = stdout.split("\n").filter((line) => line.trim() !== "");
          if (loads.length > 0) {
            const loadDetails = loads
              .map((load, index) => `• GPU ${index + 1} 负载: ${load}%`)
              .join("\n");
            gpuLoadInfo = loadDetails;
          }
        } catch (error) {
          // 如果执行 nvidia-smi 失败，忽略 GPU 负载信息
          gpuLoadInfo = null;
        }
      }

      let output = "";
      if (gpuDetails) output += `🎮 GPU 信息\n${gpuDetails}`;
      if (gpuLoadInfo) output += `\n${gpuLoadInfo}`;

      return output.trim() || null;
    } catch (error) {
      return `获取 GPU 信息时出错: ${error.message}`;
    }
  }

  async getBatteryInfo() {
    try {
      const battery = await si.battery();
      if (!battery || battery.hasBattery === false) {
        return null;
      }

      const status = battery.isCharging ? "充电中" : "未充电";
      const capacity = battery.percent ? `${battery.percent}%` : null;
      const timeRemaining =
        battery.timeRemaining !== -1 ? `${battery.timeRemaining} 分钟` : null;

      let output = "🔋 电池状态";
      output += `\n状态: ${status}`;
      if (capacity) output += `\n容量: ${capacity}`;
      if (timeRemaining) output += `\n剩余时间: ${timeRemaining}`;

      return output;
    } catch (error) {
      return `获取电池信息时出错: ${error.message}`;
    }
  }

  async getProcessInfo() {
    try {
      const processes = await si.processes();
      const sortedByCpu = processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, 5);
      const sortedByMemory = processes.list
        .sort((a, b) => b.mem - a.mem)
        .slice(0, 5);

      const topCpu =
        sortedByCpu
          .map(
            (proc) =>
              `• ${proc.name} (PID: ${proc.pid}) - CPU: ${proc.cpu.toFixed(2)}%`,
          )
          .join("\n") || null;
      const topMemory =
        sortedByMemory
          .map(
            (proc) =>
              `• ${proc.name} (PID: ${proc.pid}) - 内存: ${(proc.mem / 1024).toFixed(2)} MB`,
          )
          .join("\n") || null;

      let output = "📋 进程信息";
      if (topCpu) output += `\n🔼 CPU 使用率最高的进程:\n${topCpu}`;
      if (topMemory) output += `\n🔼 内存使用率最高的进程:\n${topMemory}`;

      return output.trim() || null;
    } catch (error) {
      return `获取进程信息时出错: ${error.message}`;
    }
  }

  async getNetworkConnections() {
    try {
      const connections = await si.networkConnections();
      if (!connections || connections.length === 0) {
        return null;
      }

      const activeConnections =
        connections
          .slice(0, 5)
          .map((conn) => {
            const protocol = conn.protocol
              ? conn.protocol.toUpperCase()
              : "UNKNOWN";
            const localAddress = conn.localaddress || "undefined";
            const localPort = conn.localport || "undefined";
            const peerAddress = conn.peeraddress || "undefined";
            const peerPort = conn.peerport || "undefined";
            const state = conn.state || "UNKNOWN";

            return `• ${protocol} ${localAddress}:${localPort} -> ${peerAddress}:${peerPort} (${state})`;
          })
          .filter((line) => !line.includes("undefined"))
          .join("\n") || null;

      return activeConnections ? `🌐 网络连接\n${activeConnections}` : null;
    } catch (error) {
      return `获取网络连接信息时出错: ${error.message}`;
    }
  }

  async getNetworkBandwidth() {
    try {
      const [stats1, stats2] = await Promise.all([
        si.networkStats(),
        new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
          si.networkStats(),
        ),
      ]);

      const bandwidthInfo =
        stats2
          .map((stat2) => {
            const stat1 = stats1.find((s) => s.iface === stat2.iface);
            if (!stat1) return null;

            const rxSpeedMB = (
              (stat2.rx_bytes - stat1.rx_bytes) /
              1024 /
              1024
            ).toFixed(2);
            const txSpeedMB = (
              (stat2.tx_bytes - stat1.tx_bytes) /
              1024 /
              1024
            ).toFixed(2);
            return `• ${stat2.iface}: In: ${rxSpeedMB} MB/s, Out: ${txSpeedMB} MB/s`;
          })
          .filter((line) => line !== null)
          .join("\n") || null;

      return bandwidthInfo ? `📡 网络使用情况\n${bandwidthInfo}` : null;
    } catch {
      return null;
    }
  }
}
