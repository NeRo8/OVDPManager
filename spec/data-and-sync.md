# Дані, сховища й синхронізація з НБУ

**Що це й навіщо.** Тут описано, що застосунок зберігає на пристрої, під якими ключами і в якому вигляді, які запити він робить до НБУ (каталог ОВДП, облікова ставка, курси валют), коли їх повторює, як заповнює дні без даних і що бачить користувач, коли даних ще немає, вони застаріли чи запит не вдався. Правила описують поточну поведінку коду.

## Звідки дані

- Сховище: `src/shared/lib/storage.ts` (`mmkvStorage`).
- Сховища стану (папка на кожне, `types.ts` / `store.ts` / `selectors.ts` / `actions.ts` / `index.ts`):
  `src/entities/portfolio/model/purchases/`, `src/entities/portfolio/model/plans/`, `src/entities/portfolio/model/activePlan/`, `src/entities/portfolio/api/bonds/`, `src/entities/portfolio/api/keyRate/`, `src/entities/portfolio/api/exchangeRate/`, `src/features/payment-filters/model/paymentFilters/`, `src/features/add-purchase/model/bondPickerFilters/`, `src/features/report-filters/model/reportFilters/`, `src/features/onboarding/model/onboarding/`, `src/shared/theme/themePreference/`, `src/shared/lib/toast/`.
- Клієнт НБУ: `src/shared/api/nbu/client.ts` (`nbuClient`, `NbuError`).
- Запити: `src/entities/portfolio/api/nbuBonds.ts`, `nbuKeyRate.ts`, `nbuExchangeRates.ts`, `dailyRates.ts`, `useBonds.hook.ts`, `keyRateQuery.ts`, `useKeyRate.hook.ts`, `useKeyRates.hook.ts`, `exchangeRateQuery.ts`, `useExchangeRates.hook.ts`.
- TanStack Query: `src/shared/api/queryClient.ts`, `src/shared/api/QueryProvider.tsx`.
- Сповіщення: `src/shared/lib/toast/`, `src/shared/ui/toast/ToastHost.tsx`, `src/shared/ui/toast/ToastView.tsx`.
- Оновлення жестом: `src/shared/lib/usePullToRefresh.hook.ts`.
- Стани екранів: `src/entities/portfolio/ui/BondsGate.tsx`, `BondsUnavailable.tsx`, `BondsUnavailableCard.tsx`, `WalletGate.tsx`, `EmptyWallet.tsx`, `StaleBondsNotice.tsx`, `NbuSourceNote.tsx`.

## Правила

### Сховище MMKV

**DATA-01.** Усі збережені сховища пишуть в один екземпляр MMKV без шифрування (`createMMKV()` без параметрів). Адаптер синхронний: `getItem` → `mmkv.getString(key) ?? null`, `setItem` → `mmkv.set`, `removeItem` → `mmkv.remove`. `src/shared/lib/storage.ts`.

**DATA-02.** Кожне збережене сховище — `create()(persist(() => initialState, { name: STORAGE_KEY, storage: createJSONStorage(() => mmkvStorage) }))`: стан зберігається як JSON-рядок під своїм ключем; бо адаптер синхронний, сховище читається під час створення, ще до першого екрана. `version` і `migrate` немає: дані іншого вигляду не перетворюються. Сховища змінюються лише через функції з `actions.ts` (`setState`). Усі `store.ts`.

**DATA-03.** Збережені сховища, їхні ключі й вигляд:

| Ключ MMKV                | Сховище                                     | Вигляд стану                                                                        | Початковий стан                    |
| ------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------- |
| `holdings-v1`            | `entities/portfolio/model/purchases`        | `{ purchases: PlanPurchase[] }`                                                     | `{ purchases: [] }`                |
| `investment-plan-v1`     | `entities/portfolio/model/plans`            | `{ plans: InvestmentPlan[] }`                                                       | `{ plans: [] }`                    |
| `active-plan-v1`         | `entities/portfolio/model/activePlan`       | `{ activePlanId: string \| null }`                                                  | `{ activePlanId: null }`           |
| `nbu-bonds-v1`           | `entities/portfolio/api/bonds`              | `{ bonds: Bond[] \| null; updatedAt: number \| null }` (мс)                         | `{ bonds: null, updatedAt: null }` |
| `nbu-key-rate-v1`        | `entities/portfolio/api/keyRate`            | `{ byYear: Record<рік, { rates: Record<дата, %>; throughDate; updatedAt }> }`       | `{ byYear: {} }`                   |
| `nbu-exchange-rates-v1`  | `entities/portfolio/api/exchangeRate`       | `{ byCurrencyYear: Record<'USD-2025' \| …, { rates; throughDate; updatedAt }> }`    | `{ byCurrencyYear: {} }`           |
| `payment-filters-v1`     | `features/payment-filters/…/paymentFilters` | `{ types; time: 'all' \| 'upcoming' \| 'past'; currency; isins }`                   | див. сховище                       |
| `bond-picker-filters-v1` | `features/add-purchase/…/bondPickerFilters` | `{ currency; term; sort: 'maturity' \| 'rate' }`                                    | див. сховище                       |
| `report-filters-v1`      | `features/report-filters/…/reportFilters`   | фільтри кожного звіту за назвою (`year`, `fx`, `period`, `yearOverYear`, …, `bond`) | див. сховище                       |
| `onboarding-v1`          | `features/onboarding/model/onboarding`      | `{ isCompleted: boolean }`                                                          | `{ isCompleted: false }`           |
| `theme-preference-v1`    | `shared/theme/themePreference`              | `{ preference: 'system' \| 'light' \| 'dark' }`                                     | `{ preference: 'system' }`         |

**DATA-04.** Дії сховища купівель (`src/entities/portfolio/model/purchases/actions.ts`): `addPurchase` (новий `id` = `Date.now()` у base36 + `-` + 6 випадкових символів, додається в кінець), `removePurchase(id)` (прибирає першу з таким `id`), `updatePurchase(id, { purchaseDate, quantity, amount })` (змінює лише ці три поля; `currency`, `isin`, `planId` лишаються), `replacePurchases` (замінює все), `removePosition(planId, isin)`, `removePlanPurchases(planId)`, `copyPlanPurchases(from, to)` (копії з новими `id` додаються в кінець). Селектори: `usePurchases`, `getPurchases` — купівлі всіх планів.

**DATA-05.** Дії сховища планів (`src/entities/portfolio/model/plans/actions.ts`): `createInvestmentPlan(name, goal?)` (id як у DATA-04, план — у кінець, повертає id), `renameInvestmentPlan`, `duplicateInvestmentPlan(id)` (назва = `name.slice(0, 80 − 8).trimEnd() + ' (копія)'`, копіює купівлі й `goal`, активний план не змінює, повертає назву або `undefined`), `removeInvestmentPlan(id)` (спершу купівлі плану, потім план), `restorePortfolio(purchases, plans)` (замінює обидва сховища). Назва перевіряється формою, сховище її не обрізає (крім суфіксів).

**DATA-06.** Активний план (`src/entities/portfolio/model/activePlan/`): `activePlanId` зберігається між запусками. Активний — план із цим id, а якщо його немає (не вибрано, видалено, замінено копією) — перший у списку; `undefined`, лише коли планів немає. `setActivePlan` не перевіряє id. `createActivePlan(name)` створює план і робить його активним. `addPurchaseToActivePlan` і `removePositionFromActivePlan` без активного плану нічого не роблять. `createGoalPlan(goal, purchases)`: назва = `name.slice(0, 80 − suffix.length).trimEnd() + ' · ціль <рік>'`, копіює купівлі активного плану, додає нові, робить копію активною, повертає назву.

**DATA-07.** Видалення плану і відновлення копії не скидають `activePlanId`: спрацьовує запасний варіант «перший план» (DATA-06), а якщо в копії є план із тим самим id — активним лишається він.

**DATA-08.** Не зберігаються між запусками: сповіщення (`src/shared/lib/toast/store.ts`, звичайний `create` без `persist`), кеш TanStack Query (лише в пам'яті, без persister), копія в хмарі (`useCloudBackup`), чернетки форм, ціна продажу, сторінка онбордингу. Вхід у Google зберігає нативний Firebase SDK, а не застосунок.

### Клієнт НБУ

**DATA-09.** Усі запити до НБУ йдуть через один `axios`-клієнт: `baseURL: 'https://bank.gov.ua'`, `timeout: 15000` мс. Будь-яка помилка перетворюється на `NbuError` з готовим текстом: відповідь із кодом → «НБУ відповів з помилкою <status>»; `ECONNABORTED`/`ETIMEDOUT` → «Час очікування відповіді НБУ минув»; інша мережева помилка → «Не вдалося з’єднатися з НБУ»; не-axios помилка → «Не вдалося завантажити дані НБУ». `src/shared/api/nbu/client.ts`.

### Каталог ОВДП

**DATA-10.** Каталог: `GET /depo_securities?json`, відповідь типізується як `NbuSecurity[]` без перевірки. Перетворення рядків і відбір валют — DOM-02…DOM-05 у `spec/domain.md`. `src/entities/portfolio/api/nbuBonds.ts`, `fetchBonds`.

**DATA-11.** `useBonds()`: запит `['nbu', 'bonds']`; `queryFn` завантажує каталог і зберігає його цілком (`saveBonds(fetched, Date.now())` — заміна, не злиття); `staleTime` = 6 годин; `initialData` і `initialDataUpdatedAt` беруться зі збереженого каталогу, тож на запуску НБУ питають, лише якщо збереженого немає або йому понад 6 годин; `meta.errorTitle` = «Не вдалося оновити дані НБУ». Екрани читають каталог зі сховища (`useCachedBonds`), а не з відповіді запиту. Повертає `bonds` (`Bond[] | null`), `error` (текст або `null`), `byIsin` (`Map` за ISIN), `refresh` (ручний `refetch`). `src/entities/portfolio/api/useBonds.hook.ts`.

### Облікова ставка

**DATA-12.** Ставка завантажується роками: `GET /NBUStatService/v1/statdirectory/key` з `start` = 1 січня року мінус 14 днів (`YYYYMMDD`), `end` = `throughDate` (`YYYYMMDD`), `id_api=KEY_PolicyRate`, `json`. Залишаються рядки з `id_api === 'KEY_PolicyRate'`; `dt` (`YYYYMMDD`) → `YYYY-MM-DD`, `value` → ставка. Потім `fillDailyRates` від 1 січня до `throughDate` з помилкою «НБУ не повернув облікову ставку на <дата>». `src/entities/portfolio/api/nbuKeyRate.ts`, `fetchKeyRates`.

**DATA-13.** `fillDailyRates(rows, firstDate, throughDate, missing)` сортує рядки за датою й для кожного календарного дня від `firstDate` до `throughDate` включно бере ставку останнього рядка з датою `<=` цього дня; дні, яких НБУ не повернув (вихідні, ще не опублікований сьогоднішній день), отримують попередню ставку. Якщо до першого дня немає жодного рядка — кидає `Error(missing(день))`. Приклад: рядки 2024-12-27 → 13,5 і 2025-01-03 → 14,5 дають 01.01–02.01 = 13,5, 03.01–04.01 = 14,5. `src/entities/portfolio/api/dailyRates.ts`.

**DATA-14.** `keyRateQuery(year)`: ключ `['nbu', 'key-rate', year]`; рік минулий, якщо `year < поточного`; `throughDate` = `year-12-31` для минулого, інакше сьогодні; збережений рік «повний», якщо його `throughDate >= throughDate`. `initialData`/`initialDataUpdatedAt` даються лише для повного року. `staleTime`: `Infinity` для минулого року, 12 годин для поточного. `queryFn` зберігає `{ rates, throughDate, updatedAt: Date.now() }` у `byYear[year]`. `meta.errorTitle` немає, тож невдалий запит ставки сповіщення не показує. `src/entities/portfolio/api/keyRateQuery.ts`.

**DATA-15.** Дата, чия ставка відповідає даті `date` (`keyRateDate`): сама дата, якщо вона раніше за сьогодні, інакше сьогодні (і для сьогодні, і для майбутньої дати). Рік запиту (`keyRateYear`) — рік цієї дати. `keyRateQuery.ts`.

**DATA-16.** `keyRateOn(byYear, date)`: `null`, якщо рік дати не завантажено; інакше `rates[date]`; якщо такого дня немає і `date > throughDate` — ставка дня `throughDate`; інакше `null`. `src/entities/portfolio/api/keyRate/selectors.ts`.

**DATA-17.** `useKeyRate(date)` повертає `keyRateOn(збережені роки, keyRateDate(date))` і запускає `keyRateQuery(keyRateYear(date))`; до першого завантаження року — `null`. `useKeyRates(dates)` запускає по одному запиту на кожен різний рік і повертає функцію `date → keyRateOn(…, keyRateDate(date))`. Обидва використовують той самий `keyRateQuery`, тож рік завантажується один раз на всі дати. `useKeyRate.hook.ts`, `useKeyRates.hook.ts`.

### Курси валют (для валютного звіту)

**DATA-18.** Курси: `GET /NBU_Exchange/exchange_site` з `start` (1 січня мінус 14 днів), `end` (`throughDate`), `valcode` (`USD` | `EUR`), `sort=exchangedate`, `order=asc`, `json`. Якщо відповідь не масив — «НБУ не повернув курси валют». Залишаються рядки з `cc === currency` і скінченним додатним `rate_per_unit`; `exchangedate` (`DD.MM.YYYY`) → `YYYY-MM-DD`. Далі `fillDailyRates` з помилкою «НБУ не повернув курс <валюта> на <дата>». `src/entities/portfolio/api/nbuExchangeRates.ts`.

**DATA-19.** `exchangeRateQuery(currency, year)`: ключ `['nbu', 'exchange-rates', currency, year]`; `throughDate` = сьогодні для поточного року, інакше `year-12-31` (також для майбутнього року); ключ сховища `"<валюта>-<рік>"`; `initialData` лише для повного року; `staleTime` = `Infinity` для `year < поточного`, інакше 12 годин; `meta.errorTitle` = «Не вдалося оновити курс <валюта>». `src/entities/portfolio/api/exchangeRateQuery.ts`.

**DATA-20.** `useExchangeRates(currency, dates)`: по запиту на кожен рік дат; `rateOn(date)` = `byCurrencyYear["<валюта>-<рік>"].rates[date] ?? null` (без запасного «останнього дня», на відміну від DATA-16); `loading` — хоч один запит `isPending`; `error` — текст першої помилки; `retry` — повторює всі запити. `src/entities/portfolio/api/useExchangeRates.hook.ts`.

### Правила TanStack Query

**DATA-21.** Типові налаштування запитів: `retry: 1` (одна повторна спроба з типовою затримкою бібліотеки); `refetchOnMount` і `retryOnMount` — функція `notFailedRecently`: `Date.now() − query.state.errorUpdatedAt > 5 хв`. Тож протягом 5 хвилин після невдачі екран, що відкривається, сам запит не повторює. Ручні `refetch` (кнопки «Спробувати ще раз», «Повторити», жест оновлення) це правило обходять. `src/shared/api/queryClient.ts`.

**DATA-22.** Повернення застосунку на передній план вмикає `focusManager.setFocused(true)` (`AppState` = `active`), і застарілі запити з активними спостерігачами оновлюються (типовий `refetchOnWindowFocus`). Правило 5 хвилин (DATA-21) на це не поширюється. `onlineManager` не налаштовано, тож «повернення мережі» запитів не запускає. `src/shared/api/QueryProvider.tsx`.

**DATA-23.** Коли запит із `meta.errorTitle` остаточно не вдався (після повторної спроби) і в нього вже є дані (`query.state.data !== undefined`), показується сповіщення: `tone: 'error'`, заголовок — `errorTitle`, текст — «<повідомлення помилки>. Показано збережені дані.», дія «Повторити» (`refetchQueries` за ключем запиту). Без даних сповіщення немає: помилку показує екран. `queryClient.ts`, `QueryCache.onError`.

### Сповіщення

**DATA-24.** Одночасно є лише одне сповіщення: нове замінює попереднє (`showToast` дає новий `id`). `tone` ∈ `error | success | info`. Воно зникає через 4 с, а з дією — через 6 с; дотик до сповіщення закриває його; дотик до дії закриває й виконує дію. Під час появи текст «<заголовок>. <текст>» зачитується для screen reader. `hideToast(id)` закриває лише сповіщення з цим `id`. `src/shared/lib/toast/actions.ts`, `src/shared/ui/toast/ToastHost.tsx`, `ToastView.tsx`.

### Оновлення жестом

**DATA-25.** `usePullToRefresh(refresh)` показує індикатор лише під час оновлення, яке запустив жест: `refreshing = true` до завершення `refresh()` (також у разі помилки). Фонові завантаження індикатор не вмикають. Гаманець, «Виплати» і «План» передають `wallet.refresh`/`refresh` з `useBonds` (лише каталог); валютний звіт — каталог разом із курсами. Облікову ставку жест не оновлює. `src/shared/lib/usePullToRefresh.hook.ts`, `src/pages/reports/ui/FxReportScreen.tsx`.

## Стани

**DATA-26.** `BondsGate` (вибір ОВДП, деталі ОВДП, форма купівлі, екран цілі): показує вміст, щойно `bonds` не `null`. Інакше: без помилки — `LoadingState` (скелет) з підписом «Завантажуємо дані НБУ…»; з помилкою — `EmptyState` з іконкою `cloud-offline-outline`, заголовком «Немає зв’язку з НБУ», текстом помилки й кнопкою «Спробувати ще раз» (ручний `refresh`). `src/entities/portfolio/ui/BondsGate.tsx`, `BondsUnavailable.tsx`.

**DATA-27.** `WalletGate` (гаманець, «Виплати», усі звіти): якщо в активному плані немає купівель — `EmptyWallet` («Гаманець порожній», «Додайте ОВДП за її номером (ISIN), датою купівлі та сумою — і побачите виплати купонів.», кнопки «Додати ОВДП» → `/add` і «Відновити з копії» → `/backup/import`); інакше — `BondsGate` (DATA-26). Порожній план перевіряється раніше, ніж наявність даних НБУ. `WalletGate.tsx`, `EmptyWallet.tsx`.

**DATA-28.** `BondsUnavailableCard` (вкладка «План»): нічого, коли каталог є; без каталогу й без помилки — `SkeletonCard` у `SkeletonGroup` з підписом «Завантажуємо дані НБУ…»; з помилкою — картка «Немає зв’язку з НБУ», текст помилки, кнопка «Спробувати ще раз». Решта екрана показується без даних НБУ. `BondsUnavailableCard.tsx`.

**DATA-29.** `StaleBondsNotice` (гаманець, «Виплати», «План», список звітів, «Від року до року»): рядок «Не вдалося оновити дані НБУ — показано збережені.» тоном `warning`, коли є і помилка, і збережений каталог; інакше нічого. Показується разом зі сповіщенням з DATA-23 і тримається, доки наступний запит не вдасться. `StaleBondsNotice.tsx`.

**DATA-30.** `NbuSourceNote` — підпис під списками з даними НБУ: «Графіки виплат — з депозитарію НБУ. Потягніть донизу, щоб оновити.» `NbuSourceNote.tsx`.

**DATA-31.** Без облікової ставки (рік ще не завантажено або запит не вдався) `useKeyRate` дає `null`, і порівняння з обліковою ставкою просто відсутні (DOM-51) — без повідомлення.

## Крайні випадки

1. **Перший запуск без мережі.** Каталогу немає: скелет до остаточної помилки (до 15 с таймауту, повторна спроба, ще до 15 с), потім «Немає зв’язку з НБУ». Протягом 5 хвилин відкриття інших екранів запит не повторює (DATA-21), але повернення на передній план — повторює (DATA-22).
2. **Оновлення не вдалося, є збережений каталог.** Екрани працюють зі збереженим; сповіщення з «Повторити» (DATA-23) і рядок `StaleBondsNotice` (DATA-29). Вік каталогу (`updatedAt`) ніде не показується.
3. **НБУ повернув порожній масив.** `bonds = []` (не `null`), тож охоронці пропускають, а всі позиції стають `unknown` без виплат.
4. **НБУ прибрав ОВДП з каталогу.** Каталог замінюється цілком (DATA-11), тож позиції цієї ОВДП стають `unknown`: зникають їхні виплати й результати.
5. **Неочікувана відповідь.** Для каталогу й ставки вигляд не перевіряється: не-масив дає `TypeError` з англійським текстом, який потрапляє в `error` і на екран. Для курсів є перевірка `Array.isArray` (DATA-18).
6. **Сьогоднішню ставку ще не опубліковано.** `fillDailyRates` заповнює сьогодні вчорашньою ставкою, і рік зберігається з `throughDate` = сьогодні; якщо ставка змінилася з сьогодні, застосунок покаже стару до наступного запиту (через 12 годин або на наступному запуску наступного дня).
7. **Новий день без перезапуску.** «Повнота» поточного року (DATA-14) перевіряється лише під час створення запиту; якщо запит уже в пам'яті, оновлення чекає `staleTime` 12 годин. `keyRateOn` тим часом дає ставку останнього збереженого дня (DATA-16).
8. **Майбутня дата.** Для ставки — сьогоднішня (DATA-15). Для курсів майбутній рік дає `throughDate` 31 грудня й, імовірно, помилку «НБУ не повернув курс…», якщо до 1 січня того року немає курсів; валютний звіт запитує лише минулі дати.
9. **Ранні роки.** Якщо НБУ не має ставки чи курсу до 1 січня року (з запасом 14 днів), `fillDailyRates` кидає помилку, і цей рік не завантажується; для ставки — мовчки.
10. **Минулий рік, збережений як поточний.** Наприклад, 2025 рік, збережений 15.12.2025: у 2026 він «неповний» (`throughDate` < 2025-12-31), тож запит повториться один раз і далі не повторюватиметься (`staleTime: Infinity`).

## Покриття тестами

- `src/entities/portfolio/api/__tests__/keyRates-test.ts`: DATA-13 (заповнення пропусків, помилка без рядка до першого дня), DATA-16 (день року, день після `throughDate`, незавантажений рік).

**Без тестів:** DATA-01…DATA-12, DATA-14, DATA-15, DATA-17…DATA-31: мапінг відповідей НБУ, ключі сховищ, дії сховищ (`duplicateInvestmentPlan` з обрізанням назви, `createGoalPlan`, запасний активний план), параметри запитів, правило 5 хвилин, сповіщення про помилку, стани охоронців.

## Прогалини й питання

**GAP-DATA-01. Правило 5 хвилин не діє на повернення на передній план.** `refetchOnWindowFocus` лишився типовим, тож без мережі кожне повернення в застосунок запускає запит каталогу (і курсів), повторну спробу й нове сповіщення «Не вдалося оновити дані НБУ». CLAUDE.md обіцяє «after a failure the next automatic try waits at least 5 minutes». Доказ: `src/shared/api/queryClient.ts` (`defaultOptions` без `refetchOnWindowFocus`), `QueryProvider.tsx`. Серйозність: середня.

**GAP-DATA-02. Облікова ставка падає мовчки й не оновлюється жестом.** У `keyRateQuery` немає `errorTitle`, жест оновлення ставку не чіпає, а після невдачі 5 хвилин немає повторів. Порівняння з обліковою ставкою (форма купівлі, «Тримати чи продати», звіт дохідності) зникають без пояснення, і користувач не відрізнить «ставки немає» від «порівнювати нема з чим». Доказ: `keyRateQuery.ts`, `useKeyRate.hook.ts`, `usePullToRefresh` у `PortfolioScreen`/`PlanScreen`. Серйозність: середня.

**GAP-DATA-03. Каталог замінюється цілком.** Якщо НБУ прибере ОВДП зі списку (наприклад, давно погашені) або поверне порожній масив, старі позиції втратять виплати й результати, а звіти за минулі роки зміняться. Чи прибирає `depo_securities` погашені ОВДП — невідомо, варто перевірити на справжній відповіді. Доказ: `useBonds.hook.ts` (`saveBonds(fetched, …)`), `bonds/actions.ts`. Серйозність: середня.

**GAP-DATA-04. Не перевіряється вигляд відповіді каталогу й ставки.** Коментар у `useBonds` стверджує, що «a malformed response from fetchBonds» має готовий текст, але перевірки немає: не-масив (наприклад, HTML-сторінка з кодом 200) дає англійський `TypeError` на екрані «Немає зв’язку з НБУ». Курси таку перевірку мають. Доказ: `nbuBonds.ts` (`data.flatMap`), `nbuKeyRate.ts` (`data.filter`). Серйозність: низька.

**GAP-DATA-05. Сьогоднішня ставка «вгадується» і зберігається як справжня.** Див. крайній випадок 6–7: заповнений учорашньою ставкою сьогоднішній день зберігається з `throughDate` = сьогодні, а «новий день» перевіряється лише для нового запиту. У день зміни ставки підказки можуть до 12 годин порівнювати зі старою. Доказ: `nbuKeyRate.ts`, `keyRateQuery.ts`. Серйозність: низька.

**GAP-DATA-06. Сховище курсів не описане в CLAUDE.md.** Ключ `nbu-exchange-rates-v1` відсутній у списку «frozen keys», папка `api/exchangeRate/` — у списку сховищ; її `index.ts` не має `export *`/`export type *` за загальним шаблоном. Також CLAUDE.md пише `persist(…, { name, storage })`, а код — `storage: createJSONStorage(() => mmkvStorage)`. Доказ: `src/entities/portfolio/api/exchangeRate/`. Серйозність: низька.

**GAP-DATA-07. Вік даних НБУ не показується.** `updatedAt` каталогу і ставок зберігається, але ніде не виводиться: «показано збережені» не каже, наскільки вони старі. Доказ: `StaleBondsNotice.tsx`, `bonds/types.ts`. Серйозність: низька.

**GAP-DATA-08. Дані на пристрої не зашифровані.** MMKV створено без `encryptionKey`, тоді як слайд онбордингу «Дані лише у вас» і шифрування копій можуть створити враження повного захисту. Доказ: `src/shared/lib/storage.ts`. Серйозність: низька.

**GAP-DATA-09. `rateOn` курсів без запасного дня.** На відміну від `keyRateOn`, курс дати після `throughDate` (наприклад, сьогодні, коли збережено вчора, а запит не вдався) — `null`. Доказ: `useExchangeRates.hook.ts`. Серйозність: низька.

**GAP-DATA-10. `useMemo` вручну.** `useBonds` загортає `byIsin` у `useMemo`, хоча AGENTS.md забороняє це під React Compiler без профілю. Доказ: `useBonds.hook.ts`. Серйозність: низька.

**GAP-DATA-11. Довге очікування першої помилки.** `timeout` 15 с і `retry: 1` означають до ~31 с скелета на першому запуску без мережі, перш ніж з'явиться «Немає зв’язку з НБУ» і кнопка повтору. Доказ: `client.ts`, `queryClient.ts`. Серйозність: низька.

**GAP-DATA-12. Мережевий шар і сховища без тестів.** Не покриті мапінг відповідей НБУ, `keyRateQuery`/`exchangeRateQuery` (повнота року, `staleTime`), `notFailedRecently`, `onError` зі сповіщенням, `duplicateInvestmentPlan`/`createGoalPlan` (обрізання назви), запасний активний план. Доказ: розділ «Покриття тестами». Серйозність: середня.
