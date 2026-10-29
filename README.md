# portfolio_sailingLog · Sailing Log

ASCII 风格、以 ONE PIECE 和航海为灵感的个人网页。独立 Vue / TypeScript / Vite 项目。

仓库：[maze-mirror/portfolio_sailingLog](https://github.com/maze-mirror/portfolio_sailingLog)

## 启动

使用 Node.js 22.18+（22 系列）或 24.12+，以及 pnpm 12.11.2。在本仓库根目录执行：

```sh
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 5177
```

打开 `http://127.0.0.1:5177/`。正常页面使用浏览器原生滚动，`?debug=1` 可显示调试进度条。

```sh
pnpm type-check
pnpm test:unit --run
pnpm build
pnpm preview --host 127.0.0.1 --port 5177
```

构建输出为 `dist/`，相对资源路径支持以后放在独立域名或子目录中。本次只整理和推送源码，没有部署网站。

## 目录

```text
src/
  SailingLog.vue    页面
  main.ts          启动入口
  components/      定位图标等组件
  scene/           动画、字符绘制、素材加载与参数
  styles/          页面和基础样式
  assets/          原始图片与字符采样数据
tests/             滚动、字符流、聚拢和循环测试
scripts/           离线素材生成工具
config/            TypeScript 检查配置
docs/
  QUALITY.md       验证记录
  DEVELOPMENT.md   迁移前开发说明
  reference/       参考录屏和原型存档
```
## 与 school-web 的关系

此项目可以单独克隆、安装、运行和更新，不依赖 school-web 的源码、依赖配置或临时预览环境。

school-web 的 `apps/portfolio-web` 仅保留指向本仓库的链接。本地原位置 `apps/portfolio-web/sailing_log` 作为独立 checkout 被 school-web 忽略；没有 Git 子模块或需要更新的父仓库提交指针。之后的主页改动在本仓库维护。
