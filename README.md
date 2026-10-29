# portfolio_sailingLog · Sailing Log

ASCII 风格、以 ONE PIECE 和航海为灵感的个人网页。独立 Vue / TypeScript / Vite 项目，包含望远镜、海洋、小岛、字符碎散、个人介绍和两幅路飞字符画。

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

## 页面与素材

- 标题 `Sailing Log`，等宽副标题 `Hi, this is L's site`。
- 单筒望远镜横向转动，放大进入镜内；海洋、白浪和随机字符小岛持续变化。
- 继续滚动时放大与碎散衔接，进入白色个人介绍页。
- 两幅路飞字符画通过收拢、完整停留、扩散循环交替，全部字符向下流动；第一幅台词框使用独立的小字符。
- 人物直接绘制字形，保持实际屏幕像素比，不放大低分辨率中间人物贴图。
- 减少动态效果偏好下停止自动人物循环；离开页面释放动画与观察器，后台暂停绘制。

原始素材为用户提供的 `src/assets/luffy-source.png` 与 `src/assets/luffy-alternate-source.jpg`，保留原文件。`src/assets/*.json` 是网页直接使用的采样数据。离线生成工具位于 `scripts/`，如需重新采样或生成望远镜帧，可安装 Python 的 numpy 与 Pillow；浏览网站和构建不需要 Python。

## 参数调试

迁移保留用户当前的页面、素材和参数，以下数值以源文件为准。

| 项目 | 文件 / 参数 |
| --- | --- |
| 人物字符大小 | `src/scene/portrait-flow.ts`：`PORTRAIT_COLUMNS`，数字越大字越小 |
| 台词字符大小 | `src/scene/portrait-flow.ts`：`SPEECH_COLUMNS` |
| 人物流速、方向 | `src/scene/portrait-flow.ts`：`PORTRAIT_FLOW_SPEED`，正数向下，负数向上，0 停止 |
| 收拢、停留、扩散时间 | `src/scene/motion.ts`：`TIMING.portraitGatherSeconds` / `portraitHoldSeconds` / `portraitScatterSeconds` |
| 两张图的尺寸、位置 | `src/scene/scene.js`：`drawAbout()` 内的 `boxWidth`、`left`、`top`；`cycle.index === 1` 为第二张 |
| 左侧文字位置 | `src/styles/sailing-log.css`：`.sl-about` 的 `padding` |
| 实际滚动距离 | `src/styles/sailing-log.css`：`.sl-journey` 的高度；`TIMING.scrollDistance` 当前不参与高度计算 |
| 海洋放大范围、幅度 | `src/scene/motion.ts`：`voyageMotion()` 中 `zoom` 的表达式 |
| 海洋碎散速度限制 | `src/scene/motion.ts`：`TIMING.scatterSeconds` |

当前调好的设置包括主体 130 列、台词 384 列、人物收拢/停留/扩散 1.1/0.7/1.1 秒；第一张尺寸范围 32%，第二张 42%，各自中心为 68% / 70%，第二张向上偏移画布高度 3%；滚动距离为 6400 px。迁移没有重新调整这些值。

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

根目录只保留 README、协作约定、HTML 入口以及依赖和构建所需的配置文件。`docs/reference/` 不随页面加载。

## 与 school-web 的关系

此项目可以单独克隆、安装、运行和更新，不依赖 school-web 的源码、依赖配置或临时预览环境。

school-web 的 `apps/portfolio-web` 仅保留指向本仓库的链接。本地原位置 `apps/portfolio-web/sailing_log` 作为独立 checkout 被 school-web 忽略；没有 Git 子模块或需要更新的父仓库提交指针。之后的主页改动在本仓库维护。
