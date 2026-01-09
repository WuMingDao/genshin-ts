# Supported TS Subset

## Not supported or limited
- Promise / async / await
- recursion
- JSON / Object native operations
- string properties/concatenation (precompute at top-level)

## Hard rules
- Conditions must be boolean (use `bool(...)`).
- `while(true)` is capped; use timers instead.
- `console.log` supports a single argument only.

## Variable semantics
- `let` forces a local variable node.
- `const` may be optimized into direct wiring.
