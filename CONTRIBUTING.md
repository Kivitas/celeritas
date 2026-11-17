# Contributing

Thank you for helping make the simulator more trustworthy. The bar is physics, not polish: a change is
useful when its numbers can be checked against a source.

## Setup

    nvm use            # Node 20 (see .nvmrc)
    npm ci
    npm run dev        # http://localhost:5173

## Before you open a pull request

    npm run typecheck  # tsc --noEmit (strict mode also passes: npx tsc --noEmit --strict)
    npm run lint
    npm test           # unit tests, including the validation records
    npm run build
    npm run build && npm run e2e   # browser smoke test; needs Playwright (see e2e/smoke.cjs)

## Rules for physics changes

1. **Cite the reference.** Every new physical constant, material coefficient or reference value needs a source
   (publication, PDG review, NIST table, or a fetched page) with its URL and retrieval date. Put it in
   `validation/references.json` and, if it is a material, in its `source` field.
2. **Do not use values from memory.** If a source cannot be reached, leave the value out and mark it unverified.
3. **Say what the change does not do.** Update `docs/physics/MODEL.md`, especially the "Not modelled" and
   "Known errors" sections.
4. **Regression snapshots are not validation.** If a snapshot changes, explain the physics reason in the commit message.
5. **Keep `src/core` pure.** No React, DOM or browser APIs, and no `Math.random` (use `src/core/rng.ts`).
6. **Do not round inside the core.** Format numbers only where they are displayed.

## Commit messages

Describe what changed and why, with the reference for any new value. Keep one logical change per commit.

## Reporting a problem

Use the issue templates. For a physics question, say which reference you compared against and what the model returned.
