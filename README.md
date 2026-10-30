# portfolio_sailingLog · Sailing Log

ASCII 风格、以 ONE PIECE 和航海为灵感的个人网页。独立 Vue / TypeScript / Vite 项目。

仓库：[maze-mirror/portfolio_sailingLog](https://github.com/maze-mirror/portfolio_sailingLog)
demo: [click here](https://maze-mirror.github.io/portfolio_sailingLog/)

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
## 字符潮汐过渡（2026-10-30）

个人介绍后继续滚动，字符海浪从顶部涌下，浪峰稍作停留后向顶部退去，留下白色区域供后续内容接入。前段沿用当前 `TIMING.scrollDistance`（5600 px），潮汐另占 2600 px；反向滚动可回看。尚未加入鱼群或半透明内容横栏。

- `src/scene/tide.ts`：GSAP 时间轴、ScrollTrigger、白底覆盖与 Canvas 绘制。推进/浪峰/回流的时间轴比例为 2.2 / 0.55 / 3.1；滚动设定目标位置，动画按时间限速追赶，避免快速滚动跳过阶段。
- `src/scene/tide-playback.ts`：介绍实际完整显现后，至少停留 `ABOUT_READ_SECONDS`（当前 2 秒）才放行潮汐。离开介绍会清除等待时间，后台时间不计入阅读；反向滚动仍可回看。
- `src/scene/tide-field.ts`：字符、蓝青色分层、不规则浪头、回卷纹理与泡沫疏密。
- `src/styles/tide.css`：潮汐叠层。减少动态效果时以白色淡入替代海浪运动。

## 与 school-web 的关系

此项目可以单独克隆、安装、运行和更新，不依赖 school-web 的源码、依赖配置或临时预览环境。

school-web 的 `apps/portfolio-web` 仅保留指向本仓库的链接。本地原位置 `apps/portfolio-web/sailing_log` 作为独立 checkout 被 school-web 忽略；没有 Git 子模块或需要更新的父仓库提交指针。之后的主页改动在本仓库维护。
