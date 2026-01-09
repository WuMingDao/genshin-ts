# 增量编译示例

示例结构：

```
src/
  entry_a.ts
  entry_b.ts
  shared.ts
```

`gsts.config.ts`：
```ts
export default {
  compileRoot: '.',
  entries: ['./src'],
  outDir: './dist'
}
```

关键点：
- 两个入口文件使用相同 `id` 会自动合并。
- 修改 `shared.ts` 应触发依赖它的入口重编译。
- `gsts dev` 仅进入监听模式，顶层代码可能多次执行。
