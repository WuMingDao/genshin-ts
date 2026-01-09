# 列表与字典

## list
- `list('int', [])` 明确空列表类型。
- 列表方法（`map`/`filter`/`find` 等）有编译支持。

## dict
- `dict(...)` 生成只读字典。
- 可写字典请声明节点图变量并通过 `f.get` / `f.set`。
