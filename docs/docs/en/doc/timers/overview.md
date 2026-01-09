# Timers

- `setTimeout` / `setInterval` are in milliseconds.
- Compiler builds name pools to avoid collisions.
- `// @gsts:timerPool=4` overrides pool size.
- `setInterval` <= 100ms triggers a warning.
