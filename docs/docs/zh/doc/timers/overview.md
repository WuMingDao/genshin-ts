# 定时器

- `setTimeout` / `setInterval` 单位为毫秒。
- 编译器自动生成名称池，规避同名冲突。
- `// @gsts:timerPool=4` 可覆盖池大小。
- `setInterval` 过高频率（<=100ms）会警告。
