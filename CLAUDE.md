# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

OVDP Manager is an Expo SDK 58 app (iOS and Android only, no web) for tracking Ukrainian government bonds (ОВДП), their future payments, investment plans and local backups. UI strings are hardcoded in Ukrainian (no i18n layer); code comments are in English. `CODEBASE.md` is the detailed map (in Ukrainian) — read it before changing data flow or storage.

## Commands

The project uses Yarn 1 (`yarn.lock`) and pins Node `22.19.0` (`.node-version`); `yarn install` fails on another Node version. iOS builds need the Ruby/CocoaPods versions from `Gemfile` (`bundle install`).

```bash
yarn start                 # dev server (needs a development build; Expo Go cannot load Unistyles/MMKV)
yarn ios | yarn android    # expo run:ios / run:android
yarn validate              # format:check + lint + lint:fsd + typecheck — Husky runs this on every commit
yarn lint:fsd              # Steiger: FSD layer/slice boundary checks
yarn format                # Prettier write
npx expo export --platform ios   # (or android) confirms the JS bundle builds
```

There is no test suite. "Done" means `yarn validate` passes.

## Architecture

Feature-Sliced Design, imports only point down: `app` (routes in `src/app/`) → `pages` → `features` → `entities` → `shared`. Cross-slice imports go through each slice's `index.ts` using the `@/` alias (`@/*` → `src/*`); imports inside a slice are relative. Routes in `src/app/` are thin and just render a screen component from `pages`.

- `index.ts` imports `src/shared/theme` (Unistyles configuration) before `expo-router/entry` — the theme must be registered before any `StyleSheet.create` runs.
- `src/entities/portfolio/` is the single domain entity: bond/purchase/plan types and calculations, the persisted stores, the NBU (National Bank of Ukraine) catalog fetch + cache (`api/`), and `useWallet()`. Screens get positions, payments and purchase events from `useWallet()` rather than recomputing schedules; `WalletGate` handles the empty-wallet / waiting-for-NBU states uniformly.
- Investment plans (`model/plans/`) are the basis of the app. A plan is `{ id, name }`; its purchases — bought or planned, any date between issue and maturity — are the wallet purchases with its `planId`. There is no separate list of planned purchases. `useWallet()` gives the active plan's purchases (`model/activePlan/`, kept across launches; falls back to the first plan), so the wallet and the payments show that plan, and a future purchase earns only after its date. The plans tab, the bond card and the purchase form all sum up through `purchaseResults` (`model/results.ts`): invested, payments, net income and return over the term, with net income and return null while NBU has not published a redemption. Purchases are added through one form (`/add/[isin]`: date, quantity, amount paid; price per bond = amount ÷ quantity, shown only).
- Navigation is native: the tab bar is `NativeTabs` (`expo-router/native-tabs`, the Liquid Glass bar on iOS 26, Material on Android). Native tabs draw no headers, so each tab is a group folder with its own stack (`(tabs)/(holdings)/_layout.tsx`, …), and screens pushed from a tab (bond, add, plan list) still open in the root stack over the tab bar. Every stack is `NativeStack` from `src/shared/ui/navigation/`, which owns the header options; don't set header colors per screen.
- Liquid Glass (`hasLiquidGlass` from `@/shared/lib`, iOS 26+): headers are transparent and the content scrolls under them, so scroll views keep `contentInsetAdjustmentBehavior="automatic"` and a non-scrolling element at the top is offset by `useHeaderHeight()` (as `TopTabs` does). Without glass (Android, older iOS) the header is a solid bar in `background`. Header buttons (`HeaderButton`) and the back button get glass from the system; the FAB is a tinted `GlassView` with a solid fallback. Glass belongs to the navigation layer and floating controls only, never to cards or other content.
- The payments top tabs (upcoming/year) use `TopTabs` from `src/shared/ui/navigation/` (`expo-router/js-top-tabs`). `lazy` is intentionally off — lazy tabs make expo-router 58 change the route key on first open and the pager jumps. The bond card (`/bond/[isin]`) is one scrolling screen, not tabs.
- The plans tab shows the active plan; the header button opens «Мої плани» (`/plan/list`) to switch or create plans; it is the only way in.

## Persistence rules

- State is Zustand `persist` over MMKV via the synchronous adapter in `src/shared/lib/storage.ts`, so stores hydrate before the first render. Every store has the same layout: a folder named after it (`model/purchases/`, `model/plans/`, `model/activePlan/`, `api/bonds/`, `api/keyRate/`, `features/payment-filters/model/paymentFilters/`, `shared/lib/toast/`, `shared/theme/themePreference/`) with `types.ts` (`<Name>State`), `store.ts` (`STORAGE_KEY`, exported `initialState`, and `use<Name>Store = create<<Name>State>()(persist(() => initialState, { name: STORAGE_KEY, storage }))`; only the toast store is not persisted), `selectors.ts` (`use…` hooks and `get…` getters), `actions.ts` (exported functions with explicit return types that change the state through `setState`; no setters inside the state) and `index.ts` (`export * from './actions'; export * from './selectors'; export type * from './types';`, never the raw store hook). Copy an existing store when adding one. The app is pre-release and installed on clean devices: stores have no `version`/`migrate` and nothing reads older data shapes or backup formats. A changed shape simply starts empty; users move data via backups.
- Storage keys are deliberately frozen: purchases live under `holdings-v1` (the state field is now `purchases`), plans under `investment-plan-v1`, filters under `payment-filters-v1`, NBU cache under `nbu-bonds-v1`, NBU key rate under `nbu-key-rate-v1`, theme under `theme-preference-v1`, active plan under `active-plan-v1`. Don't rename them.
- No `__DEV__`-only code paths or dev fixtures in the app.
- Zod is used only for forms. NBU responses, stored state and backup contents are not validated: they are typed with TypeScript types and `as`/generics (`nbuClient.get<NbuSecurity[]>`, `JSON.parse(text) as T`). Don't add zod schemas or hand-written shape checks outside forms.
- Every wallet purchase belongs to a plan (`planId`); the app shows the active plan's purchases, and with no plans only the first-plan screen (`/welcome`, the plan-name screen) and backup import are reachable. The bond picker `/add` serves both the wallet and plans (`planId` param).
- Backup JSON (`src/features/backup/model/backup.ts`) is version 6 and always encrypted with a key the user types (twice on export): Argon2id derives the key, AES-256-GCM encrypts `{ holdings, plans }` (`src/features/backup/lib/backupCipher.ts`, `react-native-quick-crypto`); the file keeps `format`, `version`, `exportedAt`, the `encryption` parameters and base64 `data`. Only this version is read: `parseBackup(text, key)` checks `format` and `version`, decrypts (a wrong key throws `WrongBackupKeyError`), needs at least one plan and a plan in the file for every purchase. Restoring replaces all plans and purchases. A lost key cannot be recovered.
- Server requests go through TanStack Query hooks (`useBonds`, `useKeyRate` in `src/entities/portfolio/api/`): the hook fetches and saves each new answer into a persisted Zustand store, which the screens read. Stores never fetch. The query client and `QueryProvider` live in `src/shared/api/`; a query with `meta.errorTitle` shows a toast with «Повторити» when it fails over data already shown.
- Pull-to-refresh: give `RefreshControl` the state from `usePullToRefresh(refresh)` (`@/shared/lib`), never a background loading flag — otherwise the spinner shows whenever a screen opens and NBU data happens to refresh.
- Feedback: events go to a toast — `showToast({ tone, title, message?, action? })` from `@/shared/lib` (store in `src/shared/lib/toast/`, `ToastHost` rendered once in `src/app/_layout.tsx`). Use it for a failed NBU refresh over cached data (with «Повторити») and finished actions. Confirmations stay `confirmDestructive` alerts; lasting states (no NBU data) stay inline.
- Forms use `react-hook-form` with `zodResolver` and `mode: 'onChange'`. The zod schema turns input text into values (`z.input` / `z.output` typing on `useForm`) and holds the user-facing messages; a form schema that depends on data is a factory next to its hook (`purchaseFormSchema(bond)`). Save is disabled while the form is invalid, and each field shows its error once edited: `FieldRow` (`src/shared/ui/form/`) under a row, or the `Section` footer under a block field. Read `isValid` / `errors` through `useFormState({ control })` and values through `useWatch` — not `form.formState`, which the React Compiler would cache.
- Screens with text fields scroll in `FormScrollView` (`src/shared/ui/layout/`, `KeyboardAwareScrollView` from `react-native-keyboard-controller` under the `KeyboardProvider` in `src/app/_layout.tsx`): it keeps the focused field and its error above the keyboard on iOS and Android. Other screens use `ScreenScrollView`.
- Dates are `YYYY-MM-DD` strings everywhere (as NBU returns them) and are compared as strings. `date-fns` is used only in `src/shared/lib/date.ts`; put new date logic there, in local time.

## Styling conventions

- Every component has its own `StyleSheet.create((theme, rt) => …)` from `react-native-unistyles`; component states are `variants` + `styles.useVariants()`; safe-area insets come from `rt.insets`.
- No raw spacing, radius, shadow or color values in components: use `theme.space.*` (4-pt scale `xxs`…`xxxl`), `theme.radius.*`, `theme.shadowCard` / `theme.shadowRaised` and the palette (`src/shared/theme/tokens.ts`, `palette.ts`). Static styles outside the theme (`screenContent`, FAB offsets) import `space` directly. Rows and screen edges are `lg` sideways and `md` vertically; sections are `xl` apart. Sizes of controls (heights, icon boxes) may stay numbers.
- Shadows use `boxShadow` strings, never `shadow*`/`elevation`. Never put a shadow and `overflow: 'hidden'` on the same view: the outer view casts it, an inner one clips (see `Section`, `SectionCell`). In dark mode `shadowCard` is transparent; the lighter card surface separates cards.
- Palette roles: deep teal `accent` for actions and income, vermilion `fab` / `danger` / purchases for money going out. Status colors for advice: `success` (green, all well), `warning` (amber, look before acting), `danger` (a loss, a mistake, an error); `*Surface` tints a banner of that status. Errors that block an action stay `danger`; a state that only needs attention (stale or missing NBU data) is `warning`. Text pairs pass WCAG AA; chart series were checked with the dataviz validator — re-run it when changing `series*` colors.
- Colors needed as non-style props (`tintColor`, `placeholderTextColor`) go through `withUnistyles`. `useUnistyles()` is reserved for navigator options in `src/app/`.
- Icons are Ionicons from `@react-native-vector-icons/ionicons/static` (font embedded by its config plugin in `app.json`; not `@expo/vector-icons`, which Expo is deprecating). In components use `ThemedIcon` from `src/shared/ui/icon/` with `uniProps={(theme) => ({ color: … })}`; icon props are typed `IconName`. Tab bar icons are the exception: SF Symbols (`sf`) on iOS and Material Symbols (`md`) on Android in `NativeTabs.Trigger.Icon`, the SF Symbol filled when the tab is selected.
- Chart series colors use `SeriesColor` keys (`coupon`, `redemption`, `purchase`) from `src/shared/theme/series.ts`, not color strings.
- One React component per `.tsx` file; shared types/utilities go in separate `.ts` files next to their consumers.

## Notes

- `ios/` and `android/` exist locally but are gitignored CNG output — configure native behavior through `app.json` only.
- `src/ovdp-backup-*.json` files are the owner's personal portfolio exports (gitignored); never read them into code or commit them.
- `.agents/skills/typescript-code-quality` holds the project's KISS/DRY/YAGNI guidance for TypeScript changes.
