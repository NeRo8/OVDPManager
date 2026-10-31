# Навігація: маршрути, вкладки, заголовки

**Що це й навіщо.** Застосунок побудовано на Expo Router: кожен файл у `src/app/` — маршрут. Корінь — один нативний стек, у якому лежать п'ять вкладок (кожна зі своїм стеком і заголовком) і всі екрани, що відкриваються поверх вкладок. Три захищені групи (`Stack.Protected`) вирішують, що доступно: знайомство з застосунком — один раз, далі перший план, далі весь застосунок. Екрани поверх інших спершу виїжджають скелетом і монтуються лише після анімації переходу (`DeferredScreen`). Тут описано повну карту маршрутів, охорону, заголовки й кнопки, поведінку переходів.

## Звідки дані

- `src/app/_layout.tsx` — кореневий стек, охорона, параметри екранів (заголовки, модальні вікна, аркуш), `ToastHost`, `LaunchSplash`.
- `src/app/(tabs)/_layout.tsx` — `NativeTabs` (вкладки); `src/app/(tabs)/(<tab>)/_layout.tsx` — стек кожної вкладки.
- Файли маршрутів `src/app/**.tsx` — тонкі обгортки, що рендерять екран з `pages` (більшість — у `DeferredScreen`).
- `src/app/+native-intent.ts` — `redirectSystemPath`.
- `src/shared/ui/navigation/NativeStack.tsx` — стек з параметрами заголовка застосунку; `DeferredScreen.tsx` — відкладене монтування; `ResetFiltersHeader.tsx` — кнопка скидання фільтрів.
- `src/shared/ui/skeleton/ScreenSkeleton.tsx` — форми скелетів `list`, `report`, `form`, `filters`.
- `src/shared/lib/navigation.ts` — `goBackOrHome`.
- Стан охорони: `useIsOnboardingCompleted()` (`src/features/onboarding`, сховище `onboarding-v1`) і `useInvestmentPlans().length > 0` (сховище `investment-plan-v1`).

## Карта маршрутів

Скорочення: **П** — подання (push — звичайний перехід у стеку; modal; formSheet), **С** — скелет `DeferredScreen` («—» — без відкладення), **Охорона**: А = `isOnboarded && hasPlans` (застосунок), W = `isOnboarded && !hasPlans`, O = `!isOnboarded`, «—» = без охорони.

| Файл маршруту                    | URL                        | Екран (`pages`)                | П         | Заголовок (статичний → з екрана)                                                                  | С         | Охорона | Звідки відкривається                                                                   |
| -------------------------------- | -------------------------- | ------------------------------ | --------- | ------------------------------------------------------------------------------------------------- | --------- | ------- | -------------------------------------------------------------------------------------- |
| `onboarding.tsx`                 | `/onboarding`              | `OnboardingScreen`             | push      | без заголовка                                                                                     | —         | O       | перший запуск (редирект)                                                               |
| `welcome.tsx`                    | `/welcome`                 | `PlanNameScreen` (перший план) | push      | «Перший план»                                                                                     | —         | W       | редирект, коли планів немає                                                            |
| `(tabs)/(payments)/index.tsx`    | `/`                        | `PaymentsScreen`               | вкладка   | «Виплати»                                                                                         | —         | А       | вкладка «Виплати»; після першого плану                                                 |
| `(tabs)/(holdings)/holdings.tsx` | `/holdings`                | `PortfolioScreen`              | вкладка   | «Гаманець»                                                                                        | —         | А       | вкладка «Гаманець»; `goBackOrHome` без історії                                         |
| `(tabs)/(reports)/reports.tsx`   | `/reports`                 | `ReportsScreen`                | вкладка   | «Звіти»                                                                                           | —         | А       | вкладка «Звіти»                                                                        |
| `(tabs)/(plan)/plan.tsx`         | `/plan`                    | `PlanScreen`                   | вкладка   | «План» → назва активного плану                                                                    | —         | А       | вкладка «План»; `dismissTo('/plan')` після нового плану                                |
| `(tabs)/(settings)/settings.tsx` | `/settings`                | `SettingsScreen`               | вкладка   | «Налаштування»                                                                                    | —         | А       | вкладка «Налаштування»                                                                 |
| `add/index.tsx`                  | `/add`                     | `BondPickerScreen`             | push      | «Оберіть ОВДП»                                                                                    | `list`    | А       | FAB «Додати ОВДП» у гаманці; `EmptyWallet`                                             |
| `add/[isin]/index.tsx`           | `/add/[isin]`              | `AddBondDetailsScreen`         | push      | «ОВДП» → ISIN                                                                                     | `list`    | А       | рядок вибору ОВДП                                                                      |
| `add/[isin]/purchase.tsx`        | `/add/[isin]/purchase`     | `AddPurchaseScreen`            | push      | «Додати купівлю» → «Додати купівлю» / «Докупити ОВДП» / «Підтвердити купівлю» / «Змінити купівлю» | `form`    | А       | деталі ОВДП; картка ОВДП (докупити, рядок купівлі); «Найближчі купівлі» (`purchaseId`) |
| `bond/[isin]/index.tsx`          | `/bond/[isin]`             | `BondScreen`                   | push      | «ОВДП» → ISIN                                                                                     | `list`    | А       | рядок позиції в гаманці                                                                |
| `bond/[isin]/sale.tsx`           | `/bond/[isin]/sale`        | `SaleScreen`                   | push      | «Продаж»                                                                                          | `form`    | А       | кнопка `SaleButton` у заголовку картки ОВДП                                            |
| `bond-filters.tsx`               | `/bond-filters`            | `BondFiltersScreen`            | modal     | «Фільтри ОВДП»                                                                                    | `filters` | А       | кнопка фільтрів на `/add`                                                              |
| `payment-filters.tsx`            | `/payment-filters`         | `PaymentFiltersScreen`         | modal     | «Фільтри виплат»                                                                                  | `filters` | А       | кнопка фільтрів вкладки «Виплати»                                                      |
| `plan/list.tsx`                  | `/plan/list`               | `PlanListScreen`               | push      | «Мої плани»                                                                                       | `list`    | А       | кнопка «Мої плани» вкладки «План»                                                      |
| `plan/name.tsx`                  | `/plan/name`               | `PlanNameScreen`               | push      | «Новий план» → «Новий план» / «Назва плану» (`planId`)                                            | `form`    | А       | «+» у «Моїх планах»; «Перейменувати план» в аркуші                                     |
| `plan/goal.tsx`                  | `/plan/goal`               | `CouponGoalScreen`             | push      | «Купони на місяць»                                                                                | `form`    | А       | прапорець вкладки «План»; «Перерахувати ціль»                                          |
| `plan/actions.tsx`               | `/plan/actions`            | `PlanActionsScreen`            | formSheet | без заголовка                                                                                     | —         | А       | кнопка ⋮ рядка в «Моїх планах»                                                         |
| `reports/year.tsx`               | `/reports/year`            | `YearReportScreen`             | push      | «Звіт за рік»                                                                                     | `report`  | А       | список звітів                                                                          |
| `reports/fx.tsx`                 | `/reports/fx`              | `FxReportScreen`               | push      | «Валютний еквівалент»                                                                             | `report`  | А       | список звітів                                                                          |
| `reports/period.tsx`             | `/reports/period`          | `PeriodReportScreen`           | push      | «Звіт за період»                                                                                  | `report`  | А       | список звітів                                                                          |
| `reports/year-over-year.tsx`     | `/reports/year-over-year`  | `YearOverYearReportScreen`     | push      | «Від року до року»                                                                                | `report`  | А       | список звітів                                                                          |
| `reports/redemptions.tsx`        | `/reports/redemptions`     | `RedemptionsReportScreen`      | push      | «Графік погашень»                                                                                 | `report`  | А       | список звітів                                                                          |
| `reports/portfolio.tsx`          | `/reports/portfolio`       | `PortfolioReportScreen`        | push      | «Звіт по портфелю»                                                                                | `report`  | А       | список звітів                                                                          |
| `reports/structure.tsx`          | `/reports/structure`       | `StructureReportScreen`        | push      | «Структура портфеля»                                                                              | `report`  | А       | список звітів                                                                          |
| `reports/yield.tsx`              | `/reports/yield`           | `YieldReportScreen`            | push      | «Річна дохідність»                                                                                | `report`  | А       | список звітів                                                                          |
| `reports/bond.tsx`               | `/reports/bond`            | `BondReportScreen`             | push      | «Звіт по ОВДП»                                                                                    | `report`  | А       | список звітів                                                                          |
| `report-filters/[report].tsx`    | `/report-filters/[report]` | `ReportFiltersScreen`          | modal     | «Фільтри звіту»                                                                                   | `filters` | А       | кнопка `ReportFiltersButton` у заголовку звіту                                         |
| `backup/export.tsx`              | `/backup/export`           | `BackupExportScreen`           | push      | «Створити копію»                                                                                  | `form`    | А       | «Налаштування»                                                                         |
| `backup/import.tsx`              | `/backup/import`           | `BackupImportScreen`           | push      | «Відновити з копії»                                                                               | `form`    | —       | «Налаштування»; «Відновити з копії» на `/welcome`; `EmptyWallet`                       |
| `+native-intent.ts`              | —                          | —                              | —         | —                                                                                                 | —         | —       | системні посилання (NAV-13)                                                            |

Файлу `+not-found` немає: невідомий шлях показує стандартний екран Expo Router «Unmatched Route».

## Правила

**NAV-01.** Корінь — один `NativeStack` усередині `GestureHandlerRootView` → `KeyboardProvider` → `QueryProvider` → `ThemeProvider` (тема навігації з палітри: `primary` = `accent`, `background`, `card`, `text`, `border`). Над стеком — `ToastHost` (тости) і `LaunchSplash`; нативний splash не ховається сам (`SplashScreen.preventAutoHideAsync()`), його ховає `LaunchSplash`. Джерело: `src/app/_layout.tsx`.

**NAV-02.** Охорона маршрутів — три групи `Stack.Protected` і один маршрут поза ними:

| Група       | Умова (`guard`)            | Куди веде, коли закрито (`redirectTo`)                    | Маршрути                                                       |
| ----------- | -------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| Знайомство  | `!isOnboarded`             | `/` якщо плани є, інакше `/welcome`                       | `onboarding`                                                   |
| Застосунок  | `isOnboarded && hasPlans`  | `/welcome` якщо знайомство пройдено, інакше `/onboarding` | `(tabs)` і всі екрани поверх, крім `welcome` і `backup/import` |
| Перший план | `isOnboarded && !hasPlans` | `/` якщо знайомство пройдено, інакше `/onboarding`        | `welcome`                                                      |
| Без охорони | —                          | —                                                         | `backup/import`                                                |

**NAV-03.** Що бачить користувач залежно від стану: знайомство не пройдено → `/onboarding` (незалежно від планів); пройдено, планів немає → `/welcome` (і доступний `/backup/import`); пройдено, плани є → `/` (вкладка «Виплати»). Перехід між станами робить сама охорона, коли змінюється сховище: `completeOnboarding()`, створення першого плану (`createActivePlan`), відновлення з копії, видалення останнього плану.

**NAV-04.** Вкладки (`NativeTabs`, порядок зліва направо): «Виплати» (SF `calendar`, Material `calendar_month`), «Гаманець» (`wallet.bifold` / `wallet.bifold.fill`, `account_balance_wallet`), «Звіти» (`doc.text` / `doc.text.fill`, `summarize`), «План» (`chart.bar` / `chart.bar.fill`, `bar_chart`), «Налаштування» (`gearshape` / `gearshape.fill`, `settings`). Вибрана вкладка має колір `accent` і заповнений SF Symbol, де він є; підписи видно на всіх вкладках (`labelVisibilityMode="labeled"`). На iOS 26 смугу вкладок малює система (Liquid Glass), інакше фон `card`, індикатор `muted`.

**NAV-05.** Кожна вкладка — тека-група зі своїм `NativeStack` і одним екраном; нативні вкладки заголовків не малюють, тож заголовок дає стек вкладки. Екрани, відкриті з вкладки (`/add`, `/bond/…`, `/plan/list`, звіти тощо), відкриваються в кореневому стеку поверх смуги вкладок, а не в стеку вкладки. Вкладки лишаються змонтованими: стан екрана вкладки (вибраний рік, місяць, валюта) зберігається при перемиканні вкладок і планів.

**NAV-06.** Параметри заголовка всіх стеків (`NativeStack`): кнопка «назад» лише стрілкою (`headerBackButtonDisplayMode: 'minimal'`); з Liquid Glass (`hasLiquidGlass`, iOS 26+) заголовок прозорий і вміст прокручується під ним, інакше суцільний фон `background`; без тіні; колір кнопок `accent`; заголовок шрифтом застосунку `semibold` у кольорі `text`; фон вмісту `background`. Екрани кольорів заголовка не задають.

**NAV-07.** Модальні фільтри («Фільтри виплат», «Фільтри ОВДП», «Фільтри звіту») — `presentation: 'modal'` з кнопкою «Закрити» (✕, `close`) ліворуч, що викликає `goBackOrHome`; праворуч екран фільтрів ставить «Скинути фільтри» (`refresh`), вимкнену, коли фільтрів немає (`ResetFiltersHeader`). Зміни фільтрів застосовуються одразу, тож модальне вікно лише закривають. Джерело: `FILTERS_MODAL` у `_layout.tsx`.

**NAV-08.** `/plan/actions` — `formSheet` з висотою за вмістом (`sheetAllowedDetents: 'fitToContents'`), видимим «язичком» і без заголовка; закривається свайпом униз або дотиком поза аркушем. Маршрут не відкладено: скелет дав би аркушу хибну висоту.

**NAV-09.** Відкладене монтування (`DeferredScreen`): якщо маршрут — перший у своєму стеку (`navigation.getState().index === 0`), вміст показано одразу. Інакше спершу видно `ScreenSkeleton` вибраної форми, а вміст монтується, коли стек повідомить `transitionEnd` для відкриття (не закриття), і з'являється з `FadeIn` за 200 мс. Разом із вмістом монтуються його хуки, `Stack.Screen`-параметри й кнопки заголовка, тож до кінця переходу заголовок має статичну назву з `_layout.tsx` і без кнопок екрана. Відкладено всі маршрути кореневого стеку, крім `onboarding`, `welcome`, `(tabs)` і `plan/actions`. Джерело: `DeferredScreen.tsx`.

**NAV-10.** Форми скелетів: `list` — картка над шістьма рядками; `report` — заголовок, картка, картка-графік, чотири рядки; `form` — два блоки полів (3 і 2); `filters` — блоки варіантів з позначками. Скелет оголошується читачу екрана як «Завантаження…» і стоїть нерухомо при зменшеному русі. Джерело: `ScreenSkeleton.tsx`.

**NAV-11.** Кнопки заголовків (одна дія — одна кнопка, праворуч):

| Екран            | Кнопка                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| «Виплати»        | фільтри: `options-outline` / заповнена `options` у `accent` з фільтрами → `/payment-filters`               |
| «План»           | прапорець `flag-outline` «Ціль: купони на місяць» → `/plan/goal`; список `list` «Мої плани» → `/plan/list` |
| «Мої плани»      | `add` «Створити план» → `/plan/name`                                                                       |
| «Оберіть ОВДП»   | `BondFiltersButton` → `/bond-filters`                                                                      |
| Картка ОВДП      | `SaleButton` → `/bond/[isin]/sale`, лише коли є оцінка «Тримати чи продати»                                |
| Кожен звіт       | `ReportFiltersButton` → `/report-filters/[report]`                                                         |
| Модальні фільтри | ліворуч «Закрити», праворуч «Скинути фільтри»                                                              |

«Гаманець» має не кнопку заголовка, а плаваючу кнопку «Додати ОВДП» (FAB).

**NAV-12.** Екрани, що самі змінюють заголовок (`Stack.Screen` усередині екрана): «План» → назва активного плану; `/plan/name` → «Перший план» / «Новий план» / «Назва плану»; `/add/[isin]` і `/bond/[isin]` → ISIN; `/add/[isin]/purchase` → «Підтвердити купівлю» (запланована купівля з `purchaseId`), «Змінити купівлю» (зроблена), «Докупити ОВДП» (ОВДП уже є в позиції), «Додати купівлю».

**NAV-13.** Системне посилання, що містить `firebaseauth/link` (повернення з входу Google), маршрутизатор відкидає (`redirectSystemPath` повертає `null`), і екран не змінюється; інші шляхи проходять без змін. Джерело: `src/app/+native-intent.ts`.

**NAV-14.** `goBackOrHome`: якщо є куди повертатися — `router.back()`, інакше `router.replace('/holdings')` (вкладка «Гаманець»). Нею закриваються модальні фільтри, і нею картка ОВДП виходить, коли видалено останню купівлю позиції.

**NAV-15.** Параметри маршрутів: `/add/[isin]`, `/add/[isin]/purchase`, `/bond/[isin]`, `/bond/[isin]/sale` — `isin`; `/add/[isin]/purchase?purchaseId=…` — редагування купівлі; `/plan/name?planId=…` — перейменування; `/plan/actions?planId=…` — план аркуша; `/report-filters/[report]` — назва звіту (`ReportName`). Параметра `planId` у `/add` немає.

**NAV-16.** Навігація після дій:

| Дія                                | Куди                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------- |
| Знайомство завершено               | охорона → `/welcome` або `/` (NAV-03)                                  |
| Перший план створено (`/welcome`)  | охорона → `/` (вкладка «Виплати»)                                      |
| Новий план створено (`/plan/name`) | `router.dismissTo('/plan')`                                            |
| План перейменовано                 | `router.back()` (до «Моїх планів»)                                     |
| «Перейменувати план» в аркуші      | `router.back()` (аркуш), потім `push('/plan/name?planId=…')`           |
| «Дублювати» / «Видалити» в аркуші  | `router.back()`; видалення останнього плану → охорона → `/welcome`     |
| «Створити план з ціллю»            | `router.back()` (на вкладку «План»)                                    |
| Купівлю збережено                  | `router.back()` (екран ОВДП лишається відкритим для ще однієї купівлі) |
| Відновлено з копії                 | `router.back()`, а без планів до відновлення — `router.replace('/')`   |
| Копію створено                     | `router.back()`                                                        |

## Стани

- **Немає даних НБУ** — навігація не змінюється; екрани самі показують `BondsGate` / `WalletGate` / `BondsUnavailableCard`.
- **Перехід ще триває** — скелет екрана (NAV-09); без анімації переходу (перший екран стеку) вміст одразу.
- **Невідомий маршрут** — «Unmatched Route» Expo Router.

## Дії й навігація

Див. NAV-11 (кнопки) і NAV-16 (після дій). Жест «назад» і кнопка «назад» — стандартні нативні.

## Крайні випадки

- **Видалення останнього плану** — група «Застосунок» закривається, і стек переходить на `/welcome`; відкриті поверх вкладок екрани зникають разом із групою.
- **`/backup/import` без охорони** — доступний і до знайомства (лише за прямим посиланням, кнопок туди немає); після відновлення `replace('/')` охорона все одно поведе на `/onboarding`, поки знайомство не пройдено.
- **Глибоке посилання одразу на відкладений маршрут** при холодному старті: якщо маршрут виявиться першим у стеку, вміст покажеться одразу; якщо під ним опиниться `(tabs)` без анімації, невідомо, чи прийде `transitionEnd` (GAP-NAV-03).
- **Аркуш і наступний екран.** «Перейменувати план» спершу закриває аркуш, потім відкриває екран назви поверх «Моїх планів», а не поверх аркуша.
- **Повернення з цілі.** Після «Створити план з ціллю» `router.back()` веде на вкладку «План», яка вже показує новий активний план (і нову назву в заголовку).

## Покриття тестами

Тестів навігації немає: Jest покриває лише доменні модулі, екрани й маршрути не тестуються (так задумано в CLAUDE.md). **Без тестів:** NAV-01…NAV-16, зокрема логіка охорони (NAV-02/03), `DeferredScreen` (NAV-09), `goBackOrHome` (NAV-14), `redirectSystemPath` (NAV-13).

## Прогалини й питання

**GAP-NAV-01.** Поки триває перехід на відкладений екран, у заголовку статична назва з `_layout.tsx`, яку екран потім замінює: «Новий план» → «Назва плану» при перейменуванні, «Додати купівлю» → «Підтвердити купівлю», «ОВДП» → ISIN. Назва помітно змінюється. Доказ: `DeferredScreen.tsx`, `_layout.tsx`, `PlanNameScreen.tsx`, `AddPurchaseScreen.tsx`. Важливість: низька.

**GAP-NAV-02.** `goBackOrHome` без історії завжди веде на «Гаманець», навіть із «Фільтрів виплат» чи «Фільтрів звіту», чиї екрани — інші вкладки. Доказ: `src/shared/lib/navigation.ts`. Важливість: низька.

**GAP-NAV-03.** Невідомо, чи `DeferredScreen` не застрягне на скелеті, коли маршрут відкрито глибоким посиланням при холодному старті з іншим маршрутом під ним і без анімації: вміст чекає `transitionEnd`, якого може не бути. Не перевірено. Доказ: `DeferredScreen.tsx` (`ready` лише за `index === 0` або `transitionEnd`). Важливість: низька.

**GAP-NAV-04.** CLAUDE.md пише, що `/add` служить і гаманцю, і планам через параметр `planId`; у коді такого параметра немає — купівля завжди йде в активний план. Документ застарів. Доказ: `BondPickerScreen.tsx`, `AddPurchaseScreen.tsx`. Важливість: низька.

**GAP-NAV-05.** Після створення першого плану користувач потрапляє на вкладку «Виплати» з порожнім гаманцем (`EmptyWallet`), хоча наступний крок — додати купівлю в «Гаманці». Доказ: охорона `welcome` з `redirectTo` `/`. Важливість: низька.

**GAP-NAV-06.** CLAUDE.md каже: «There are no top tabs … the bond card is one scrolling screen», але картка ОВДП має перемикач «Виплати (N) / Купівлі (N)» (`SegmentedSelect`), що показує один із двох списків. Документ або код розходяться (деталі — у [screens/wallet-and-bond.md](screens/wallet-and-bond.md)). Доказ: `BondScreen.tsx` (`BondTab`). Важливість: низька.

**GAP-NAV-07.** Миготіння вмісту під прозорим заголовком iOS 26 при поверненні на вкладку «План» — див. GAP-PLAN-01 у [screens/plan.md](screens/plan.md). Важливість: низька.
