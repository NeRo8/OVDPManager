This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
yarn lint                   # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run checks, including lint and typecheck, only when the user explicitly requests them. Report when changes have not been checked.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Data validation

- Implement forms with React Hook Form and a Zod schema; validate user input when the form is submitted before writing it to Zustand. Validation during editing may also be used for feedback.
- Treat data written to Zustand through these validated boundaries as valid in internal code. Do not repeat the same defensive checks in calculations; keep checks needed for the calculation's actual domain or possible states.
- Validate the contents of the app's backups after receiving and decrypting them, before replacing local data, whether the backup comes from the server or a file. Encryption integrity and schema validation serve different purposes.
- Type responses from third-party APIs such as NBU and trust their declared contract instead of adding runtime response-shape validation. If the contract changes, update the app in a patch.
- When changing persisted data formats, account for existing stored data and backup compatibility; provide a migration where needed.

## Skills and project overrides

Third-party skills in `.claude/skills/` are general guides; this project's setup wins when they disagree. Code layout and data flow are described in `CLAUDE.md`.

- On conflicts, the Expo plugin skills (`expo-*`) and `react-native-unistyles-v3` take precedence over `react-native-best-practices` and `vercel-composition-patterns`.
- Never add a dependency the user did not ask for, even when a skill recommends one (FlashList, LegendList, zeego, `@gorhom/bottom-sheet`, NativeWind, SWR, jotai, …). Install packages only with `npx expo install`, never `npm install` with a pinned version from a skill.
- React Compiler is on (`experiments.reactCompiler` in `app.json`). Do not add `useMemo`, `useCallback` or `memo` by hand unless a profile shows the compiler skipped the component.
- Reanimated 4 / worklets: use `scheduleOnRN` / `scheduleOnUI` instead of `runOnJS`, and `.get()` / `.set()` on shared values instead of `.value`.
- Styling uses Unistyles 3: import `StyleSheet` from `react-native-unistyles`, not from `react-native`.
- Zod is v4: use `z.email()`, `z.iso.date()`, the `error` param, `z.flattenError()` / `z.treeifyError()`; not the Zod 3 forms (`.email()`, `message`, `required_error`, `.flatten()`, `.merge()`).
- The folder layout is the default Expo one plus `stores/`, `api/` and `lib/` (see `CLAUDE.md`). Do not restructure existing code unless asked:
  - `src/app/` is the Expo Router root; never rename it or put non-route files in it.
  - Import modules by file through `@/`; don't add barrel `index.ts` files, except the one every store folder has.
  - Keep the NBU requests in `api/nbu/` and their caches in `stores/`, the `*.hook.ts` file naming, tests next to the module they cover, and one folder per store with `types.ts` / `store.ts` / `selectors.ts` / `actions.ts` / `index.ts`.
- Declare component props as a named type (`type Props = {...}`), even where skill examples write them inline.
