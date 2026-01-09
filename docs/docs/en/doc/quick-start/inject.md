# Injection and Maps

## Injection config
Set `inject` in `gsts.config.ts`:
- `gameRegion` / `playerId`
- `mapId` / `nodeGraphId`

## Safety checks
- Target graph must exist and be empty or start with `_GSTS`.
- Use `inject.skipSafeCheck = true` only if you know the risks.

## Apply changes
- Reload the map after injection.
- Use a temporary empty map to swap quickly and force reload.
- Saving the map before reload overwrites injected content.
