# gstsServer Example

```ts
function gstsServerSum(a: bigint, b: bigint) {
  return a + b
}

function gstsServerLog(msg: string) {
  gsts.f.printString(msg)
}
```

Notes:
- Must be top-level declarations.
- Only a single trailing `return <expr>` is allowed.
- Calls only inside `g.server().on(...)` or another `gstsServer*`.
- `gsts.f` is available inside `gstsServer*` for node APIs.
