# g.server 参数与入口

常用参数：
- `id` / `name` / `prefix` / `type`
- `variables`
- `lang`

注入安全要求：
- 目标图必须存在，且为空或以 `_GSTS` 开头。
- 新建图后必须保存地图才能被识别。
