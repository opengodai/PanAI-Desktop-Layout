# PanAI Desktop Layout

顶部状态栏与左侧 Dock 的完整 GNOME 桌面定制，已在 Ubuntu 26.04.1、GNOME Shell 50.1、Wayland、Ubuntu Dock 105 上验收。

- 顶部时间靠左，显示日期、星期和秒；工作区指示器位于屏幕中央。
- 白色工作区胶囊在鼠标悬停的椭圆背景内居中；校正 Dock 导致的工作区中心偏移。
- 左侧 Dock：28px、紧凑间距、垂直居中、透明底板，应用启动器位于底部。
- 九色启动器：全彩图标、彩色悬停/按下反馈、三色扩散淡出动画。
- Windows 挂载卷可使用红、绿、蓝、黄四色图标。
- 包含 115 项类型明确的 GSettings 配置、收藏入口、全部自定义图标、安装、当前会话激活和回退工具。

## 一键安装

先将仓库克隆到本地，再运行脚本：

```bash
git clone https://github.com/opengodai/PanAI-Desktop-Layout.git
cd PanAI-Desktop-Layout
./install.sh
```

脚本只修改当前用户目录与本项目涉及的 GSettings，自动备份并读回配置；保留其他扩展的启用状态。不使用 sudo，不安装软件包，不停止应用或重启桌面。

可先只读检查：

```bash
./install.sh --check
```

安装需要系统已提供 GNOME Shell 50、Ubuntu Dock，以及带 PyGObject/GIO 的 Python。脚本优先使用 `~/.venvs/ai/bin/python`；其他环境可通过 `PANDESKTOP_PYTHON` 指定解释器。

### 无需注销的即时生效

Dock 设置会即时更新。GNOME 对新建本地扩展的发现有限制，已导入的 JavaScript 也有会话缓存。因此安装脚本会输出一条基于实际仓库路径的命令，在 **Alt+F2 → `lg`** 中执行，随后按 Esc 即可应用顶部布局与动画。脚本不会开启 unsafe mode 或绕过 Shell 权限。

命令形式如下（用安装脚本输出的实际路径替换示例）：

```js
await import('file:///absolute/path/to/PanAI-Desktop-Layout/scripts/activate-live.js')
```

其他安装路径应使用安装脚本输出的命令。新登录的会话会自动加载已启用的扩展。

### 可选：Windows 四色图标

仅对明确指定的已挂载磁盘入口设置 GIO 图标元数据，不修改分区内文件：

```bash
./install.sh --windows-root /实际挂载路径/Windows
```

图标使用独立文件名以避开同名图标缓存。已创建的磁盘入口可能需要刷新；不必卸载磁盘。

## 一键回退

```bash
./restore.sh
```

或指定本用户备份目录：

```bash
./restore.sh ~/.local/state/PanDesktop/backups/备份编号
```

备份保存在 `$XDG_STATE_HOME/PanDesktop/backups`（默认 `~/.local/state/PanDesktop/backups`），回退只恢复本项目涉及的设置、文件和扩展成员关系。运行中已导入的源码存在 GNOME 会话缓存，源码回退和当前画面恢复应分别验证。回退前的源码与配置备份会保留，不包含截图和应用数据。

## 源码与验证

- `extension/`：完整自定义扩展，UUID 保留为 `archgpt-desktop-polish@archgpt.local`，与已验收实例兼容。
- `icons/`：九色图标 SVG、全色 PNG 别名、Windows 四色 SVG 和图标主题。
- `config/`：顶部、Dock 的完整配置与已测运行环境。
- `scripts/`：安装/回退实现及无需注销的激活入口。
- `tests/`：布局、生命周期、动画清理和安装回退测试。

```bash
./install.sh --check
node tests/lifecycle.cjs
node tests/screen-center.cjs
node tests/button-align.cjs
~/.venvs/ai/bin/python tests/installer.py
```

依赖由系统 GNOME/Ubuntu Dock 和已安装应用提供；右侧托盘保持原有应用的原生行为。收藏中的应用仍需已安装，PanCapture 为独立项目。[验收边界](docs/VALIDATION.md)、[来源与依赖](docs/PROVENANCE.md)。

## 名称与兼容性

项目已从 PanDesktop 更名为 **PanAI Desktop Layout**，GitHub 仓库为 `opengodai/PanAI-Desktop-Layout`。保留扩展 UUID、原有 `PanDesktop` 备份目录和本机安装路径，确保已有配置与回退记录继续可用。

2026-11-07 修复了旧会话扩展实例的问题，并增加会话恢复后的布局校正。回归测试覆盖扩展启停及会话布局重建；当前桌面已实际确认顶部时钟靠左、工作区指示器居中。
