# Incremental Example

Example structure:

```
src/
  entry_a.ts
  entry_b.ts
  shared.ts
```

`gsts.config.ts`:
```ts
export default {
  compileRoot: '.',
  entries: ['./src'],
  outDir: './dist'
}
```

Key points:
- Same `id` entries merge automatically.
- Editing `shared.ts` should rebuild dependent entries.
- `gsts dev` is watch mode; top-level code may run more than once.
