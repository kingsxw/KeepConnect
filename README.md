# KeepConnect

VPN 连接保活工具，专为深信服 EasyConnect 设计。

## 功能特性

- 🚀 一键启动 EasyConnect
- 📊 实时监控 VPN 连接状态
- ⏰ 自动保活，防止 VPN 掉线
- 🔧 支持 TCP 和 ICMP 两种保活协议
- 🎨 简洁美观的界面
- 🖥️ 支持 macOS、Windows 和 Linux 系统
- 📦 最小化到系统托盘

## 系统要求

- macOS 10.13+、Windows 10+ 或 Linux (Ubuntu 18.04+, Debian 9+, CentOS 7+)
- 已安装深信服 EasyConnect 客户端

## 安装

### 从 GitHub Releases 下载

访问 [Releases](https://github.com/kingsxw/KeepConnect/releases) 页面下载对应系统的安装包。

### 从源码运行

```bash
# 克隆仓库
git clone https://github.com/kingsxw/KeepConnect.git
cd KeepConnect

# 安装依赖
npm install

# 运行
npm start
```

## 使用说明

1. **启动 EasyConnect**
   - 点击"启动 EasyConnect"按钮，自动启动 EasyConnect 客户端

2. **检查 VPN 状态**
   - 点击"检查 VPN 状态"按钮，查看当前 VPN 连接状态

3. **配置保活服务**
   - 设置目标 IP 地址
   - 选择保活协议（TCP 或 ICMP）
   - 设置保活间隔时间（分钟）
   - 如果选择 TCP 协议，还需要设置端口号

4. **测试连接**
   - 点击"测试连接"按钮，测试目标 IP 是否可达

5. **启动保活**
   - 配置完成后，点击"启动保活"按钮
   - 程序将按照设定的间隔自动发送保活包

6. **最小化到托盘**
   - 点击窗口最小化按钮或关闭按钮，程序将隐藏到系统托盘
   - 点击托盘图标可重新显示窗口
   - 右键托盘图标可选择退出程序

## 配置说明

### 保活协议

- **TCP**: 通过建立 TCP 连接来保活，适用于需要保持端口连接的场景
- **ICMP**: 通过发送 Ping 包来保活，适用于简单的网络连通性检测

### 保活间隔

- 建议设置为 5-15 分钟
- 间隔太短可能增加网络负担
- 间隔太长可能导致 VPN 掉线

## 构建说明

```bash
# 安装依赖
npm install

# 构建 macOS 版本
npm run build:mac

# 构建 Windows 版本
npm run build:win

# 构建 Windows x86 版本
npm run build:win:x86
```

构建产物将输出到 `dist` 目录。

## 开发

```bash
# 运行开发模式
npm start
```

## 技术栈

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Node.js](https://nodejs.org/) - 后端运行时
- [HTML/CSS/JavaScript](https://developer.mozilla.org/) - 前端技术

## 许可证

本项目采用 ISC 许可证。详见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 免责声明

本工具仅用于学习和研究目的，请勿用于非法用途。使用本工具所产生的一切后果由使用者自行承担。

## 致谢

感谢深信服提供的 EasyConnect 客户端。
