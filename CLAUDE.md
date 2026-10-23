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
- Investment plans (`plan.store.ts`) are the basis of the app. A plan is `{ id, name }`; its purchases — bought or planned, any date between issue and maturity — are the wallet purchases with its `planId`. There is no separate list of planned purchases. `useWallet()` gives the active plan's purchases (`activePlan.store.ts`, kept across launches; falls back to the first plan), so the wallet and the payments show that plan, and a future purchase earns only after its date. The plans tab sums the plan up with `planTotals`. Purchases are added through one form (`/add/[isin]`: date, quantity, amount paid; price per bond = amount ÷ quantity, shown only).
- The payments top tabs (upcoming/year) use `TopTabs` from `src/shared/ui/navigation/` (`expo-router/js-top-tabs`). `lazy` is intentionally off — lazy tabs make expo-router 58 change the route key on first open and the pager jumps. The bond card (`/bond/[isin]`) is one scrolling screen, not tabs.
- The plans tab shows the active plan; the header button opens «Мої плани» (`/plan/list`) to switch or create plans; it is the only way in.

## Persistence rules

- State is Zustand `persist` over MMKV via the synchronous adapter in `src/shared/lib/storage.ts`, so stores hydrate before the first render. The app is pre-release and installed on clean devices: stores have no `version`/`migrate` and nothing reads older data shapes or backup formats. A changed shape simply starts empty; users move data via backups.
- Storage keys are deliberately frozen: purchases live under `holdings-v1` (the state field is now `purchases`), plans under `investment-plan-v1`, filters under `payment-filters-v1`, NBU cache under `nbu-bonds-v1`, theme under `theme-preference-v1`, active plan under `active-plan-v1`. Don't rename them.
- No `__DEV__`-only code paths or dev fixtures in the app.
- External data (NBU responses, backup files) and stored purchases are parsed with zod schemas (`purchase.schema.ts`); a corrupt stored purchase is skipped rather than breaking the whole wallet.
- Every wallet purchase belongs to a plan (`planId`); the app shows the active plan's purchases, and with no plans only the first-plan screen (`/welcome`, the plan-name screen) and backup import are reachable. The bond picker `/add` serves both the wallet and plans (`planId` param).
- Backup JSON (`src/features/backup/model/backup.ts`) is version 5: `holdings` (every purchase, with `planId`) + `plans` (names only). Only this version is read: `parseBackup` checks `format` and `version`, needs at least one plan and a plan in the file for every purchase. Restoring replaces all plans and purchases.
- Pull-to-refresh: give `RefreshControl` the state from `usePullToRefresh(refresh)` (`@/shared/lib`), never a background loading flag — otherwise the spinner shows whenever a screen opens and NBU data happens to refresh.
- Feedback: events go to a toast — `showToast({ tone, title, message?, action? })` from `@/shared/lib` (store in `toast.store.ts`, `ToastHost` rendered once in `src/app/_layout.tsx`). Use it for a failed NBU refresh over cached data (with «Повторити») and finished actions. Confirmations stay `confirmDestructive` alerts; lasting states (no NBU data) stay inline.
- Forms use `react-hook-form` with `zodResolver` and `mode: 'onChange'`. The zod schema turns input text into values (`z.input` / `z.output` typing on `useForm`) and holds the user-facing messages; a form schema that depends on data is a factory next to its hook (`purchaseFormSchema(bond)`). Save is disabled while the form is invalid, and each field shows its error once edited: `FieldRow` (`src/shared/ui/form/`) under a row, or the `Section` footer under a block field. Read `isValid` / `errors` through `useFormState({ control })` and values through `useWatch` — not `form.formState`, which the React Compiler would cache.
- Dates are `YYYY-MM-DD` strings everywhere (as NBU returns them) and are compared as strings. `date-fns` is used only in `src/shared/lib/date.ts`; put new date logic there, in local time.

## Styling conventions

- Every component has its own `StyleSheet.create((theme, rt) => …)` from `react-native-unistyles`; component states are `variants` + `styles.useVariants()`; safe-area insets come from `rt.insets`.
- No raw spacing, radius, shadow or color values in components: use `theme.space.*` (4-pt scale `xxs`…`xxxl`), `theme.radius.*`, `theme.shadowCard` / `theme.shadowRaised` and the palette (`src/shared/theme/tokens.ts`, `palette.ts`). Static styles outside the theme (`screenContent`, FAB offsets) import `space` directly. Rows and screen edges are `lg` sideways and `md` vertically; sections are `xl` apart. Sizes of controls (heights, icon boxes) may stay numbers.
- Shadows use `boxShadow` strings, never `shadow*`/`elevation`. Never put a shadow and `overflow: 'hidden'` on the same view: the outer view casts it, an inner one clips (see `Section`, `SectionCell`). In dark mode `shadowCard` is transparent; the lighter card surface separates cards.
- Palette roles: deep teal `accent` for actions and income, vermilion `fab` / `danger` / purchases for money going out. Text pairs pass WCAG AA; chart series were checked with the dataviz validator — re-run it when changing `series*` colors.
- Colors needed as non-style props (`tintColor`, `placeholderTextColor`) go through `withUnistyles`. `useUnistyles()` is reserved for navigator options in `src/app/`.
- Icons are Ionicons from `@react-native-vector-icons/ionicons/static` (font embedded by its config plugin in `app.json`; not `@expo/vector-icons`, which Expo is deprecating). In components use `ThemedIcon` from `src/shared/ui/icon/` with `uniProps={(theme) => ({ color: … })}`; icon props are typed `IconName`. Tab icons are filled when selected and `-outline` otherwise.
- Chart series colors use `SeriesColor` keys (`coupon`, `nominal`, `purchase`) from `src/shared/theme/series.ts`, not color strings.
- One React component per `.tsx` file; shared types/utilities go in separate `.ts` files next to their consumers.

## Notes

- `ios/` and `android/` exist locally but are gitignored CNG output — configure native behavior through `app.json` only.
- `src/ovdp-backup-*.json` files are the owner's personal portfolio exports (gitignored); never read them into code or commit them.
- `.agents/skills/typescript-code-quality` holds the project's KISS/DRY/YAGNI guidance for TypeScript changes.
