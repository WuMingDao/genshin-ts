# gstsServer 函数规范

## 约束
- 必须是顶层声明。
- 参数只能是标识符（禁止解构/默认值/rest）。
- 只允许末尾单一 `return <expr>`。
- 调用只能发生在 `g.server().on(...)` 或另一个 `gstsServer*` 内。

## 使用
- 在 `gstsServer*` 内可直接使用 `gsts.f` 访问节点图 API。
- 允许读写顶层变量（作为预计算/配置读取）。
