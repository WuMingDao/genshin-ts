# Dev Mode (gsts dev)

## What it does
- Watches files and runs incremental compilation.
- Auto injects and backs up when injection is configured.

## Notes
- `npm run dev` calls `gsts dev`.
- Dependency changes may recompile multiple entries.
- Top-level code may run multiple times; avoid side effects.
