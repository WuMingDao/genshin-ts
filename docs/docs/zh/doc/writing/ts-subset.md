# 可编译 TS 子集

## 不支持/受限
- Promise / async / await
- 递归
- JSON / Object 原生操作
- 字符串属性/拼接（建议顶层预处理）

## 强约束
- 条件必须是 boolean（必要时用 `bool(...)`）。
- `while(true)` 受循环上限影响，建议用定时器。
- `console.log` 仅支持单一参数。

## 变量语义
- `let` 可强制生成节点图局部变量。
- `const` 可能被优化为直接连线。
