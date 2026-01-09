# 注入与地图

## 注入配置
`gsts.config.ts` 中配置 `inject` 字段：
- `gameRegion` / `playerId`
- `mapId` / `nodeGraphId`

## 安全检查
- 目标节点图必须存在，且为空或名称以 `_GSTS` 开头。
- 可设置 `inject.skipSafeCheck = true` 跳过检查（谨慎）。

## 生效方式
- 注入后必须重新加载地图。
- 建议准备一个“临时空地图”用于快速切换触发重载。
- 注入后如未加载即保存地图，注入内容会被覆盖，需要重新注入。
