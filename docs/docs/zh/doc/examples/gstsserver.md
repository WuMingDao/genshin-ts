# gstsServer 示例

```ts
function gstsServerSum(a: bigint, b: bigint) {
  return a + b
}

function gstsServerLog(msg: string) {
  gsts.f.printString(msg)
}
```

要点：
- 必须是顶层声明。
- 只允许末尾单一 `return <expr>`。
- 调用只能发生在 `g.server().on(...)` 或另一个 `gstsServer*` 内。
- 在 `gstsServer*` 内可直接使用 `gsts.f` 访问节点图 API。
