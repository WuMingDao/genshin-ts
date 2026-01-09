# Common Patterns

## Conditions and types
- Use `bool(...)` for conditions.
- `number` -> float, `bigint` -> int.

## Lists and dicts
- Use `list('int', [])` for empty lists.
- `dict(...)` is read-only; use graph variables for writable dicts.

## Entity placeholders
- `entity(0)` keeps entity params empty in the editor.

## Debug output
- Prefer `print(str(...))` or `console.log(x)` (single arg).
