# Zombie Drive development

- Work only in this project; GitLab checkouts are reference sources.
- Follow `docs/game-concept.md`. Keep shared tuning in `packages/shared/src/configs/game.ts`, terrain profiles in `configs/maps/`, vehicle definitions in `configs/vehicles/`, hazards in `configs/hazards.ts`, and stage definitions and spawn layouts in `configs/stages/` and `configs/spawns/`. `vehicleConfig.ts` and `stageConfig.ts` are lookup functions; their data catalogs live under `configs/`. `identifiers.ts` defines available IDs. Pass the chosen config to each simulation without mutating global settings.
- Keep client settings in `apps/web/src/configs/`: cutscene scripts, timings, copy and audio mixes in `scenes/`; artwork, terrain themes, audio catalog, controls, upgrade copy and world map in separate config modules. Configs must not import React components, state controllers or simulation/rendering implementations.
- Keep React, rendering, physics and persistence separate. Physics must run without Phaser or the DOM.
- Assemble the simulation in `createGame`; keep render updates in `RunVisuals` and load only the selected stage and vehicle assets. Keep the before-step and after-step ordering explicit. Stage metadata drives the map, artwork and progression; do not repeat per-stage branches in the UI.
- Use the existing project style: four spaces, explicit condition blocks, one statement per line, grouped imports and generic array types. Keep the project independent of GitLab packages.
- Separate multiline statements, declarations, object properties, array elements and JSX siblings with a blank line before and after them. Do not add padding at the beginning or end of a containing block. Keep leading comments attached to the declaration they explain. `layout/padding-around-multiline` enforces this across the project; run `npm run lint:fix`.
- Inside functions, separate declarations, guards, actions and returns with a blank line. Keep related declarations together; separate distinct phases of physics and persistence. Put nested ternary branches on separate lines with four-space indentation. Run `npm run lint:fix` after formatting.
- Use strict TypeScript, validate external data with shared Zod schemas, and avoid assertions, `any` and non-null assertions.
- Keep source modules under 300 lines and functions under 25 lines. Split responsibilities during implementation.
- For changes to physics or persistence run `npm run check`; use the temporary test PostgreSQL, never reset `.local/postgres`.
- Treat reports, starts and purchases as idempotent operations. Preserve existing guest progress and snapshots of run rules.
- Keep garage requests in `GarageActions` and completion delivery in `settleRun`. Retry lost requests with their original key; reset the start key only after a confirmed start, stage switch or cancellation.
