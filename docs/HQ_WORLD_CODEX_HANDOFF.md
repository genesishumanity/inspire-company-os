# INSPIRE Company OS — HQ World Engine / Codex Handoff

Status: implementation handoff
Branch: `feature/hq-world-v1`
Production: DO NOT TOUCH

## Decision

Stop iterating on the current DOM/CSS office diagram and stop generating a single cinematic HQ image as the runtime.

The fastest path is to reuse/adapt the original MIT-licensed Pixel Agents webview/world runtime and replace its local terminal-hook/WebSocket data source with an INSPIRE Company OS adapter that polls `/api/bootstrap`.

The approved cinematic INSPIRE HQ artwork is an ART DIRECTION / layout reference for the later skin. It must not be used as a flat wallpaper pretending to be the world engine.

## Goal of this implementation pass

Build a vanilla functional world first. Do NOT spend this pass recreating the final cinematic INSPIRE skin.

Minimum PASS demo:
1. Company OS preview loads the Pixel Agents-style Canvas world.
2. Exactly the current five presences are represented: Founder presence (human, not autonomous AI), Admin, Research, Marketing, Finance.
3. Data comes from Company OS `/api/bootstrap`, not terminal transcripts/hooks.
4. Research `waiting` -> visible idle state.
5. Research `working` -> walks to assigned Research desk -> work/type animation.
6. Research `thinking` -> read/think behavior.
7. `agent_output` -> talk animation + REAL speech bubble sourced from the backend event.
8. Return to `waiting` -> stops working and becomes idle/lounge behavior.
9. Agent selection/detail can expose current Company OS status/task/event without exposing secrets.
10. Static build is served by the Company OS preview Worker.

## Architecture

```text
Company OS / D1
      |
      v
GET /api/bootstrap (polling)
      |
      v
InspireCompanyOSProvider / InspireWorldAdapter
      |
      v
normalized AgentEvent/state
      |
      v
existing Pixel Agents runtime/state machine
      |
      +--> pathfinding
      +--> character animation
      +--> speech bubbles
      +--> seat/zone assignment
      v
Canvas 2D world
```

Do not give the renderer direct D1 access.
Do not give the renderer Cloudflare/API secrets.

## State mapping

Initial mapping (adapt to actual upstream state names rather than inventing a parallel engine):

- `working` -> walk to assigned desk -> work/type
- `thinking` -> walk/stay at work zone -> read/think
- `waiting` -> idle; optionally deterministic lounge/cafe idle destination
- `reviewing` -> read/review; meeting behavior only if existing engine supports it cleanly
- `blocked` -> idle/stop work + subtle blocked indicator
- `sleeping` -> leave/offsite or hidden presence

Event mapping:
- `agent_output` -> talk + real speech bubble using event summary/output
- `message_sent` -> communication/talk indicator
- `ai_started` -> transition toward work behavior where useful

Never create fake backend work just to animate the office.
Ambient behavior must be visibly/deterministically separate from real Company OS events.

## Polling

Use `/api/bootstrap` as the source of truth.
Reuse/adapt the existing Company OS adaptive polling policy where practical:
- active: ~8s
- idle: ~15-30s
- hidden: ~60s

Do not introduce a high-frequency AI heartbeat. Movement/ambient simulation is local/deterministic and should not consume AI inference.

## Existing Company OS behavior that MUST survive

Do not rewrite backend product behavior for this visual pass.
Preserve:
- D1 data model/migrations
- Cloudflare Access/auth
- Founder approval gates
- task/message/event APIs
- scheduler/circuit breaker
- AI budget/run leases
- audit log
- Founder Inbox
- production mutation/security rules
- production deployment gate

The world is a visualization/interaction client for the existing Company OS, not a new source of truth.

## Current roster

Current registry/presences only:
- Founder Office / Can — HUMAN presence, not AI employee
- Admin / Operations
- Research / Knowledge
- Marketing
- Finance / Unit Economics

Do not fabricate a 20-30 person workforce.
Future HR/other rooms can exist later as empty physical spaces, but not fake active agents.

## Security audit BEFORE integration

Audit the original upstream Pixel Agents code/dependencies before running it against Company OS.
Specifically inspect:
- outbound network calls
- telemetry/error reporting
- terminal hooks
- transcript/session scanning
- filesystem reads/writes
- env/credential access
- WebSocket/server listeners
- dependency install/build scripts
- dynamic code execution / shell execution

Remove/disable anything not needed by the browser world runtime.

Renderer must NOT receive:
- API keys/secrets
- D1 credentials
- full prompts/private memories
- source documents
- emails/customer data
- terminal transcripts
- arbitrary filesystem access

Only expose the minimum normalized world payload required to visualize work.

## Licensing

Use the ORIGINAL MIT-licensed Pixel Agents upstream as the code source/reference.
Preserve required MIT copyright/license notices.

Do NOT copy implementation code from community forks that add noncommercial/source-available restrictions. Their behavior ideas (coffee/break/sofa etc.) may be used as product references, but reimplement such additions ourselves on the MIT base if needed.

## Repository strategy

For speed in this pass, first prove the integration on `feature/hq-world-v1` without touching production.
If importing the upstream UI cleanly requires an isolated package/directory, prefer something like:

`world/` or `webview-ui/`

Do not dump third-party source into `src/ui.js`.

A separate private `genesishumanity/inspire-world-engine` repository is acceptable if Codex determines that keeping upstream history/dependencies isolated is materially cleaner. If creating a new repo is not available/necessary, keep the integration isolated inside this feature branch and document provenance/upstream commit.

Do not block the first functional proof on repo restructuring.

## Static build / Worker integration

Target result:
- build the browser world as static assets
- serve them from Company OS Worker static asset configuration/public directory
- keep `/api/*` routed to existing Worker backend
- preview-only deployment for validation

Inspect current Wrangler version/config before choosing the exact static-assets mechanism. Do not invent a static binding without checking compatibility.

## Current branch history / cleanup

`feature/hq-world-v1` contains an earlier experimental DOM/vector HQ implementation and preview mock Worker. Treat that visual renderer as disposable.

Keep useful pieces only if they help:
- preview isolation
- `/api/bootstrap` preview mock
- existing backend/status bindings/tests

Remove/replace the office-diagram renderer rather than polishing it.

There may also be experimental HQ asset-serving changes from the prior attempt. Inspect git diff/history before proceeding; do not assume those experiments are correct.

## Approved final visual direction — LATER PASS

After the vanilla engine PASS, skin it to the approved INSPIRE world:
- cinematic/isometric 2.5D office
- warm premium lighting
- glass + wood + concrete
- restrained INSPIRE purple
- Dubai dusk/day-night skyline
- central atrium with large tree/lounge
- Founder upper-left
- Research left
- Marketing lower-left
- Kitchen & Cafe upper/center
- Admin & Operations right
- Finance lower-right
- reception/main entrance
- elevators bottom-right
- rooftop terrace
- HR/People Ops room may exist empty
- quiet rooms may exist empty
- large dark matte reception rug with purple INSPIRE asterisk/logo
- no redundant slogans/logos

Master artwork is composition/style reference, NOT the runtime background solution.

Final asset system should allow floor/walls/furniture/foreground occluders/characters/lights to be separate enough for depth sorting and movement.

## Later behavior roadmap (NOT required for first PASS)

After core adapter works:
- cafe/lounge breaks
- agent-to-agent collaboration visualization
- arrivals/leaving/offsite
- overtime driven by real unfinished work
- office day/night cycle
- room lighting based on presence/overtime
- deterministic ambient speech clearly distinguished from real output
- configurable Office Time separate from authoritative Real Time

Life-state concept later:
`offsite -> arriving -> available -> working -> collaborating -> break -> overtime -> leaving -> offsite`

Do not implement all of this before the basic Company OS-driven state transition works.

## Testing / evidence

Required before calling V1 integration PASS:
- dependency/security audit summary
- install/build PASS
- existing Company OS tests still PASS or document any unrelated pre-existing failure
- adapter unit/contract tests for status/event mapping
- preview smoke
- visual evidence of at least `waiting -> working -> waiting`
- visual evidence of real `agent_output` speech bubble
- no production changes

## Deployment boundaries

Allowed:
- feature branch changes
- isolated preview Worker
- preview static assets
- test/mock `/api/bootstrap`

Forbidden without explicit Founder approval:
- merge to main
- production deploy
- production D1 mutation/migration
- Access/auth changes
- production secrets changes
- `ops.getinspration.com` changes

## Stop condition

STOP this implementation pass when the vanilla Pixel Agents-derived world is successfully driven by `/api/bootstrap` and the Research state-transition smoke passes.

Do not continue into final cinematic asset production automatically. Report evidence, blockers, changed files, upstream commit/license provenance, and recommended next step first.
