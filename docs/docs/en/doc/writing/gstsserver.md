# gstsServer Rules

## Constraints
- Must be a top-level declaration.
- Params must be identifiers (no destructuring/default/rest).
- Only a single trailing `return <expr>` is allowed.
- Calls only inside `g.server().on(...)` or another `gstsServer*`.

## Usage
- `gsts.f` is available inside `gstsServer*` for node APIs.
- Top-level variables can be read/written for precompute/config.
