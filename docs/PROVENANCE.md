# 来源和运行依赖

本仓库包含本次开发的 GNOME 扩展源码、原创 SVG/PNG 图标及配置工具。未复制 GNOME Shell、Ubuntu Dock、Adwaita 或第三方应用源码。

运行依赖由已安装的 GNOME Shell 50、Ubuntu Dock、GIO/GSettings、Adwaita/hicolor 图标主题提供。托盘图标来自当前系统及用户已运行的应用。图标主题仅覆盖九点启动器，其余图标从 Adwaita/hicolor 继承。

窗口、屏幕捕获、任意代码执行与远程访问均不属于扩展功能；即时启用使用用户显式打开的 GNOME Looking Glass。

## 本项目许可

原创源码、脚本、配置、文档和图标统一采用 GPL-3.0-or-later（见根目录 LICENSE 与 COPYRIGHT），除非文件有明确的独立声明。GNOME/Ubuntu Dock/Adwaita 等系统依赖未随本仓库重新许可或打包。版权与商标权不因本项目开源而转移。
