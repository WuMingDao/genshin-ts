# Workflow Overview

## Compilation pipeline
1. TS -> `.gs.ts`
2. `.gs.ts` -> IR `.json`
3. IR -> `.gia`
4. Inject into map `.gil`

## Scope split
- Top-level scope is for precompute, file I/O, and npm usage.
- Node graph scope is compiled into graph logic.

## Artifacts
- `.gs.ts` for semantic checks.
- `.json` for node wiring and types.
- `.gia` as the final injectable output.
