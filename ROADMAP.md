# Flappy Bots Roadmap

## Phase 1: Repository Analysis

Status: Done locally.

- Inspected `MS-ShellRunners`.
- Inspected `MS-BackEnd`.
- Inspected `MS-FrontEnd`.
- ShellRunners uses `/shellrunners`, `/shellrunners/spectate`, tokenized play/spectate WebSockets, postMessage token handoff, env-driven iframe security, and Vercel Next.js deployment.

## Phase 2: New Project Scaffold

Status: Implemented.

- Created `MS-FlappyBots`.
- Added Next.js, React, TypeScript, Phaser.
- Added routes, env config, CSP, and Vercel config.

## Phase 3: Core Game Engine

Status: Implemented.

- Added deterministic seed support.
- Added gravity, flap, obstacle generation, collision, scoring, and adapter methods.

## Phase 4: Phaser Rendering

Status: Implemented with placeholders.

- Added original sci-fi canvas rendering.
- Added HUD overlays.
- Added placeholder asset files.

## Phase 5: AI-Agent Runtime Interface

Status: Implemented.

- Added observation/action types.
- Added `FLAP`/`NOOP` adapter.
- Added baseline local test policy.

## Phase 6: Human Test Mode

Status: Implemented.

- Added `/flappybots/test`.
- Added Space/click/tap/restart controls.
- Added visible TEST MODE label.
- Test mode does not submit scores.

## Phase 7: MoltStation Backend Integration

Status: Implemented in code; requires deployment and env verification.

- Register slug `flappybots`.
- Add backend authoritative simulator.
- Add action handling to WebSocket play protocol.
- Keep test/browser sources non-reward-eligible.

## Phase 8: MoltStation Frontend Integration

Status: Implemented in code; requires visual QA.

- Add Flappy Bots catalog fallback and game copy.
- Update legacy `flappy-bots` references to `flappybots`.
- Add test demo CTA and live spectate path.

## Phase 9: Deployment

Status: Prepared, not deployed.

- Vercel config is present.
- Production domain target is `https://game.moltstation.games/flappybots`.
- Deployment requires Vercel credentials and domain/project access.

## Phase 10: Testing and QA

Status: Pending verification.

- Run `npm install`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- Test AI mode, test mode, spectate mode, iframe embedding, and mobile layout.

## Open Questions

- Whether `game.moltstation.games` can host multiple Vercel projects by path or needs a single routing project.

## Backend TODOs

- Confirm production `MOLT_GAMES_CATALOG_JSON` or Mongo catalog includes Flappy Bots if defaults are not used.
- Confirm rewards source env keeps only `agent_api` reward-eligible.

## Frontend TODOs

- Replace placeholder/upcoming banner with final generated Flappy Bots thumbnail.
- Verify copy and CTA placement on mobile.

## Deployment TODOs

- Configure Vercel env vars.
- Attach or route runtime domain.
- Smoke test production WebSocket origin allowlists.
