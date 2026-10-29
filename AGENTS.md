# Sailing Log 协作约定

- 此仓库是 L 的独立个人网站，远程仓库为 `maze-mirror/portfolio_sailingLog`；应用入口 `/`，项目显示名 Sailing Log。
- 修改前阅读本仓库 README.md 与 docs/QUALITY.md。历史开发说明在 docs/DEVELOPMENT.md；不依赖 school-web 的文件或配置。
- 保留用户调好的参数，未经要求不重置密度、大小、位置、速度、停留时间或美术方案。源码中的当前值优先于历史文档。
- 保留望远镜、海洋、小岛、字符碎散、个人介绍和两幅人物交替这条叙事。
- 页面在 src/SailingLog.vue，动画与参数在 src/scene，样式在 src/styles，测试在 tests；根目录只保留项目说明与必要配置。
- 原始人物文件为 src/assets/luffy-source.png 和 src/assets/luffy-alternate-source.jpg；保留原文件，不用早期生成图替代。
- 用户已确认所有字符向下流动，不固定人物边界；第一幅台词框使用独立的小字符。两幅图通过收拢、完整停留、扩散循环，文字不随人物切换重播。
- 使用本地打包依赖与采样数据，不增加 Codex 临时路径或外部 CDN 依赖。
- 修改后执行类型检查、相关测试和生产构建，并记录实际验证结果；历史验证不算当前验证。
- 推送或部署须有用户明确授权，不自动发布网站。本次迁移已获授权推送至上述仓库；school-web 不在此次提交和推送范围内。
