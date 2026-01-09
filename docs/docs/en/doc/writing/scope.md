# Scope Split

## Top-level scope (compile time)
- File I/O, npm usage, precompute.
- Top-level code may run multiple times.

## Node graph scope (runtime)
- Only a supported TS subset.
- Code inside `g.server().on(...)` and `gstsServer*` is compiled.

## Tips
- `raw(...)` tells the compiler to skip processing and use JS semantics.
- `stage.set` can be used as a global variable store.
