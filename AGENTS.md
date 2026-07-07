# AGENTS.md

## Project Overview

`@topcli/prompts` is a small Node.js library providing interactive CLI prompts (question, select, multiselect, confirm) for terminal user input. Pure ESM, TypeScript source, no runtime dependencies.

## Conventions

- **No build step for tests/dev.** Node >=24 runs `src/**/*.ts` and `test/**/*.ts` directly (native type stripping) — there's no `ts-node`/`tsx`/watch-compile step. Relative imports must use an explicit `.ts` extension (e.g. `"./validators.ts"`, `"../../src/index.ts"`), never `.js`.
- **`using` declarations are intentional**, not a typo for `const` (e.g. `using prompt = new QuestionPrompt(...)` in `src/index.ts`). This is TC39 explicit resource management: `AbstractPrompt` implements `Disposable`/`Symbol.dispose` to auto-close the prompt (readline interface, listeners) when the block exits.
- **No `package-lock.json` is committed** (`.npmrc` sets `package-lock=false`); don't add one. `.npmrc` also sets `ignore-scripts=true`, matching CI's `npm install --ignore-scripts`.
- **`tsconfig.json` (`@openally/config.typescript/esm-ts-next`) targets Node's native type stripping**, so `erasableSyntaxOnly` is on: no `enum`, no constructor parameter properties, no `namespace`/`module` — anything that needs real JS emitted, not just erased, is a compile error. `verbatimModuleSyntax` is also on, so type-only imports must use `import type { X }` (or inline `type` specifiers) — a plain `import { X }` for a type-only symbol will fail the build. `noImplicitAny` is deliberately `false` while the rest of `strict` is on, so untyped params/returns won't be flagged.

## Essential Commands

- `npm run test-only` — fast, runs `node --test` directly against `.ts` sources, no build required. Use this while iterating.
- `npm run build` — `tsdown src/index.ts --dts --clean`, emits `dist/`. Required before `node demo.js` or `test-types` will work.
- `npm run test-types` — builds, then `tsd` (checks `test/types/*.test-d.ts`) + `@arethetypeswrong/cli` (checks the published package's type/export shape).
- `npm test` — full gate: `test-only` + coverage (`c8`) + `test-types`. Slower; run once before finishing up, mirrors CI (`.github/workflows/node.js.yml`).
- `npm run lint` / `npm run lint:fix` — ESLint over `src`/`test` (`lint:fix` covers `.`).
