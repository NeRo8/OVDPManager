# Дані, сховища й синхронізація з НБУ

**Що це й навіщо.** Тут описано, що застосунок зберігає на пристрої, під якими ключами і в якому вигляді, які запити він робить до НБУ (каталог ОВДП та облікова ставка), коли їх повторює, як заповнює дні без даних і що бачить користувач, коли даних ще немає, вони застаріли чи запит не вдався. Правила описують поточну поведінку коду.

## Звідки дані

- Сховище: `src/shared/lib/storage.ts` (`mmkvStorage`).
- Сховища стану (папка на кожне, `types.ts` / `store.ts` / `selectors.ts` / `actions.ts` / `index.ts`):
  `src/entities/portfolio/model/purchases/`, `src/entities/portfolio/model/plans/`, `src/entities/portfolio/model/activePlan/`, `src/entities/portfolio/api/bonds/`, `src/entities/portfolio/api/keyRate/`, `src/features/payment-filters/model/paymentFilters/`, `src/features/add-purchase/model/bondPickerFilters/`, `src/features/onboarding/model/onboarding/`, `src/shared/config/appSettings/`, `src/shared/lib/toast/`.
- Клієнт НБУ: `src/shared/api/nbu/client.ts` (`nbuClient`, `NbuError`).
- Запити: `src/entities/portfolio/api/nbuBonds.ts`, `nbuKeyRate.ts`, `dailyRates.ts`, `useBonds.hook.ts`, `keyRateQuery.ts`, `useKeyRate.hook.ts`.
- TanStack Query: `src/shared/api/queryClient.ts`, `src/shared/api/QueryProvider.tsx`.
- Сповіщення: `src/shared/lib/toast/`, `src/shared/ui/toast/ToastHost.tsx`, `src/shared/ui/toast/ToastView.tsx`.
- Оновлення жестом: `src/shared/lib/usePullToRefresh.hook.ts`.
- Стани екранів: `src/entities/portfolio/ui/BondsGate.tsx`, `BondsUnavailable.tsx`, `BondsUnavailableCard.tsx`, `WalletGate.tsx`, `EmptyWallet.tsx`, `StaleBondsNotice.tsx`, `NbuSourceNote.tsx`.

## Правила

### Сховище MMKV

**DATA-01.** Усі збережені сховища пишуть в один екземпляр MMKV без шифрування (`createMMKV()` без параметрів); це обране правило зберігання на пристрої. Резервні копії шифруються перед збереженням у файл чи відправленням у хмару. Адаптер синхронний: `getItem` → `mmkv.getString(key) ?? null`, `setItem` → `mmkv.set`, `removeItem` → `mmkv.remove`. `src/shared/lib/storage.ts`.

**DATA-02.** Кожне збережене сховище — `create()(persist(() => initialState, { name: STORAGE_KEY, storage: createJSONStorage(() => mmkvStorage) }))`: стан зберігається як JSON-рядок під своїм ключем; `appSettings` зберігає лише тему і час останнього відкриття, а поточну дату відновлює під час запуску; бо адаптер синхронний, сховище читається під час створення, ще до першого екрана. `version` і `migrate` немає: дані іншого вигляду не перетворюються. Сховища змінюються лише через функції з `actions.ts` (`setState`). Усі `store.ts`.

**DATA-03.** Збережені сховища, їхні ключі й вигляд:

| Ключ MMKV                | Сховище                                     | Вигляд стану                                                                        | Початковий стан                                   |
| ------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| `holdings-v1`            | `entities/portfolio/model/purchases`        | `{ purchases: PlanPurchase[] }`                                                     | `{ purchases: [] }`                               |
| `investment-plan-v1`     | `entities/portfolio/model/plans`            | `{ plans: InvestmentPlan[] }`                                                       | `{ plans: [] }`                                   |
| `nbu-bonds-v1`           | `entities/portfolio/api/bonds`              | `{ bonds: Bond[] \| null; updatedAt: number \| null }` (мс)                         | `{ bonds: null, updatedAt: null }`                |
| `nbu-key-rate-v1`        | `entities/portfolio/api/keyRate`            | `{ byYear: Record<рік, { rates: Record<дата, %>; throughDate; updatedAt }> }`       | `{ byYear: {} }`                                  |
| `payment-filters-v1`     | `features/payment-filters/…/paymentFilters` | `{ types; time: 'all' \| 'upcoming' \| 'past'; currency; isins }`                   | див. сховище                                      |
| `bond-picker-filters-v1` | `features/add-purchase/…/bondPickerFilters` | `{ currency; term; sort: 'maturity' \| 'rate' }`                                    | див. сховище                                      |
| `onboarding-v1`          | `features/onboarding/model/onboarding`      | `{ isCompleted: boolean }`                                                          | `{ isCompleted: false }`                          |
| `theme-preference-v1`    | `shared/config/appSettings`                 | `{ preference, lastOpenedAt }`; дата `today` лише в пам’яті                         | тема `system`, дата запуску, `lastOpenedAt: null` |

**DATA-04.** Дії сховища купівель (`src/entities/portfolio/model/purchases/actions.ts`): `addPurchase` (новий `id` = `Date.now()` у base36 + `-` + 6 випадкових символів, додається в кінець), `removePurchase(id)` (прибирає першу з таким `id`), `updatePurchase(id, { purchaseDate, quantity, amount })` (змінює лише ці три поля; `currency`, `isin`, `planId` лишаються), `replacePurchases` (замінює все), `removePosition(planId, isin)`, `removePlanPurchases(planId)`, `copyPlanPurchases(from, to)` (копії з новими `id` додаються в кінець). Селектори: `usePurchases`, `getPurchases` — купівлі всіх планів.

**DATA-05.** Дії сховища планів (`src/entities/portfolio/model/plans/actions.ts`): `createInvestmentPlan(name, goal?)` (id як у DATA-04, план — у кінець, повертає id), `renameInvestmentPlan`, `duplicateInvestmentPlan(id)` (назва = `name.slice(0, 80 − 8).trimEnd() + ' (копія)'`, копіює купівлі й `goal`, активний план не змінює, повертає назву або `undefined`), `removeInvestmentPlan(id)` (спершу купівлі плану, потім план), `restorePortfolio(purchases, plans)` (замінює обидва сховища). Назва перевіряється формою, сховище її не обрізає (крім суфіксів).

**DATA-06.** Активний план визначається полем `isActive` у сховищі планів. Серед наявних планів активний рівно один; якщо планів немає, активний план — `undefined`. `setActivePlan` змінює ознаку в планах; невідомий id залишає поточний вибір. `createActivePlan(name)` створює план і робить його активним. `addPurchaseToActivePlan` і `removePositionFromActivePlan` без активного плану нічого не роблять. `createGoalPlan(goal, purchases)` копіює купівлі активного плану, додає нові та робить копію активною.

**DATA-07.** Після видалення активного плану активним стає перший із решти. Резервні копії зберігають `activePlanId` у форматі версії 6; при відновленні копії без нього активним стає перший план.

**DATA-08.** Не зберігаються між запусками: сповіщення (`src/shared/lib/toast/store.ts`, звичайний `create` без `persist`), кеш TanStack Query (лише в пам'яті, без persister), копія в хмарі (`useCloudBackup`), чернетки форм, ціна продажу, сторінка онбордингу. Вхід у Google зберігає нативний Firebase SDK, а не застосунок.

### Клієнт НБУ

**DATA-09.** Усі запити до НБУ йдуть через один `axios`-клієнт: `baseURL: 'https://bank.gov.ua'`, `timeout: 8000` мс. Будь-яка помилка перетворюється на `NbuError` з готовим текстом: відповідь із кодом → «НБУ відповів з помилкою <status>»; `ECONNABORTED`/`ETIMEDOUT` → «Час очікування відповіді НБУ минув»; інша мережева помилка → «Не вдалося з’єднатися з НБУ»; не-axios помилка → «Не вдалося завантажити дані НБУ». `src/shared/api/nbu/client.ts`.

### Каталог ОВДП

**DATA-10.** Каталог: `GET /depo_securities?json`, відповідь типізується як `NbuSecurity[]`, її структура додатково не перевіряється. Перетворення рядків і відбір валют — DOM-02…DOM-05 у `spec/domain.md`. `src/entities/portfolio/api/nbuBonds.ts`, `fetchBonds`.

**DATA-32.** Дати останнього оновлення каталогу й облікової ставки доступні в налаштуваннях; повідомлення про помилку оновлення каталогу показує дату збережених даних.

**DATA-11.** `useBonds()`: запит `['nbu', 'bonds']`; `queryFn` завантажує каталог і зберігає його цілком (`saveBonds(fetched, Date.now())` — заміна, не злиття); `staleTime` = 6 годин; `initialData` і `initialDataUpdatedAt` беруться зі збереженого каталогу, тож на запуску НБУ питають, лише якщо збереженого немає або йому понад 6 годин; `meta.errorTitle` = «Не вдалося оновити дані НБУ». Екрани читають каталог зі сховища (`useCachedBonds`), а не з відповіді запиту. Повертає `bonds` (`Bond[] | null`), `error` (текст або `null`), `byIsin` (`Map` за ISIN), `refresh` (ручний `refetch`). `src/entities/portfolio/api/useBonds.hook.ts`.

### Облікова ставка

**DATA-12.** Ставка завантажується роками: `GET /NBUStatService/v1/statdirectory/key` з `start` = 1 січня року мінус 14 днів (`YYYYMMDD`), `end` = `throughDate` (`YYYYMMDD`), `id_api=KEY_PolicyRate`, `json`. Відповідь типізується як `NbuKeyRow[]`; залишаються рядки з `id_api === 'KEY_PolicyRate'`; `dt` (`YYYYMMDD`) → `YYYY-MM-DD`, `value` → ставка. Потім `fillDailyRates` від 1 січня до `throughDate` з помилкою «НБУ не повернув облікову ставку на <дата>». `src/entities/portfolio/api/nbuKeyRate.ts`, `fetchKeyRates`.

**DATA-13.** `fillDailyRates(rows, firstDate, throughDate, missing)` сортує рядки за датою й для кожного календарного дня від `firstDate` до `throughDate` включно бере ставку останнього рядка з датою `<=` цього дня; дні, яких НБУ не повернув (вихідні, ще не опублікований сьогоднішній день), отримують попередню ставку. Якщо до першого дня немає жодного рядка — кидає `Error(missing(день))`. Приклад: рядки 2024-12-27 → 13,5 і 2025-01-03 → 14,5 дають 01.01–02.01 = 13,5, 03.01–04.01 = 14,5. `src/entities/portfolio/api/dailyRates.ts`.

**DATA-14.** `keyRateQuery(year)`: ключ `['nbu', 'key-rate', year]`; рік минулий, якщо `year < поточного`; `throughDate` = `year-12-31` для минулого, інакше сьогодні; збережений рік «повний», якщо його `throughDate >= throughDate`. `initialData`/`initialDataUpdatedAt` даються лише для повного року. `staleTime`: `Infinity` для минулого року, 12 годин для поточного. `queryFn` зберігає `{ rates, throughDate, updatedAt: Date.now() }` у `byYear[year]`. `meta.errorTitle` немає, тож невдалий запит ставки сповіщення не показує. `src/entities/portfolio/api/keyRateQuery.ts`.

**DATA-15.** Дата, чия ставка відповідає даті `date` (`keyRateDate`): сама дата, якщо вона раніше за сьогодні, інакше сьогодні (і для сьогодні, і для майбутньої дати). Рік запиту (`keyRateYear`) — рік цієї дати. `keyRateQuery.ts`.

**DATA-16.** `keyRateOn(byYear, date)`: `null`, якщо рік дати не завантажено; інакше `rates[date]`; якщо такого дня немає і `date > throughDate` — ставка дня `throughDate`; інакше `null`. `src/entities/portfolio/api/keyRate/selectors.ts`.

**DATA-17.** `useKeyRate(date)` повертає `keyRateOn(збережені роки, keyRateDate(date))` і запускає `keyRateQuery(keyRateYear(date))`; до першого завантаження року — `null`. `useKeyRate.hook.ts`.

### Правила TanStack Query

**DATA-21.** Типові налаштування запитів: `retry: 1` (одна повторна спроба з типовою затримкою бібліотеки). Після остаточної помилки автоматичні повтори під час відкриття екрана, повернення на передній план і відновлення з’єднання чекають понад 5 хвилин (`notFailedRecently`). Ручні `refetch` (кнопки «Спробувати ще раз», «Повторити», жест оновлення) це правило обходять. `src/shared/api/queryClient.ts`.

**DATA-22.** Під час запуску й повернення на передній план `recordAppOpening` оновлює календарну дату та час відкриття. Повернення на передній план передається у `focusManager`: активні запити оновлюються лише тоді, коли їхній кеш застарів і минуло понад 5 хвилин після останньої помилки. Минулі роки ставки із `staleTime: Infinity` примусово не оновлюються. `onlineManager` не налаштовано для мережі пристрою. `src/shared/api/QueryProvider.tsx`.

**DATA-23.** Коли запит із `meta.errorTitle` остаточно не вдався (після повторної спроби) і в нього вже є дані (`query.state.data !== undefined`), показується сповіщення: `tone: 'error'`, заголовок — `errorTitle`, текст — «<повідомлення помилки>. Показано збережені дані.», дія «Повторити» (`refetchQueries` за ключем запиту). Без даних сповіщення немає: помилку показує екран. `queryClient.ts`, `QueryCache.onError`.

### Сповіщення

**DATA-24.** Одночасно є лише одне сповіщення: нове замінює попереднє (`showToast` дає новий `id`). `tone` ∈ `error | success | info`. Воно зникає через 4 с, а з дією — через 6 с; дотик до сповіщення закриває його; дотик до дії закриває й виконує дію. Під час появи текст «<заголовок>. <текст>» зачитується для screen reader. `hideToast(id)` закриває лише сповіщення з цим `id`. `src/shared/lib/toast/actions.ts`, `src/shared/ui/toast/ToastHost.tsx`, `ToastView.tsx`.

### Оновлення жестом

**DATA-25.** `usePullToRefresh(refresh)` показує індикатор лише під час оновлення, яке запустив жест. Гаманець, план і «Виплати» оновлюють каталог НБУ та облікову ставку. Ручне оновлення обходить строк свіжості кешу й паузу після помилки. `src/shared/lib/usePullToRefresh.hook.ts`, `src/entities/portfolio/model/useWallet.hook.ts`.

## Стани

**DATA-26.** `BondsGate` (вибір ОВДП, деталі ОВДП, форма купівлі, екран цілі): показує вміст, щойно `bonds` не `null`. Інакше: без помилки — `LoadingState` (скелет) з підписом «Завантажуємо дані НБУ…»; з помилкою — `EmptyState` з іконкою `cloud-offline-outline`, заголовком «Немає зв’язку з НБУ», текстом помилки й кнопкою «Спробувати ще раз» (ручний `refresh`). `src/entities/portfolio/ui/BondsGate.tsx`, `BondsUnavailable.tsx`.

**DATA-27.** `WalletGate` (гаманець, «Виплати»): якщо в активному плані немає купівель — `EmptyWallet` («Гаманець порожній», «Додайте ОВДП за її номером (ISIN), датою купівлі та сумою — і побачите виплати купонів.», кнопки «Додати ОВДП» → `/add` і «Відновити з копії» → `/backup/import`); інакше — `BondsGate` (DATA-26). Порожній план перевіряється раніше, ніж наявність даних НБУ. `WalletGate.tsx`, `EmptyWallet.tsx`.

**DATA-28.** `BondsUnavailableCard` (вкладка «План»): нічого, коли каталог є; без каталогу й без помилки — `SkeletonCard` у `SkeletonGroup` з підписом «Завантажуємо дані НБУ…»; з помилкою — картка «Немає зв’язку з НБУ», текст помилки, кнопка «Спробувати ще раз». Решта екрана показується без даних НБУ. `BondsUnavailableCard.tsx`.

**DATA-29.** `StaleBondsNotice` (гаманець, «Виплати», «План»): рядок «Не вдалося оновити дані НБУ — показано збережені.» тоном `warning`, коли є і помилка, і збережений каталог; інакше нічого. Показується разом зі сповіщенням з DATA-23 і тримається, доки наступний запит не вдасться. `StaleBondsNotice.tsx`.

**DATA-30.** `NbuSourceNote` — підпис під списками з даними НБУ: «Графіки виплат — з депозитарію НБУ. Потягніть донизу, щоб оновити.» `NbuSourceNote.tsx`.

**DATA-31.** Без облікової ставки (рік ще не завантажено або запит не вдався) `useKeyRate` дає `null`, і порівняння з обліковою ставкою просто відсутні (DOM-51) — без повідомлення.

## Крайні випадки

1. **Перший запуск без мережі.** Каталогу немає: після остаточної помилки показано «Немає зв’язку з НБУ». Автоматичний повтор під час відкриття екрана чи повернення на передній план чекає понад 5 хвилин; кнопка повтору доступна одразу (DATA-21).
2. **Оновлення не вдалося, є збережений каталог.** Екрани працюють зі збереженим; сповіщення з «Повторити» (DATA-23) і рядок `StaleBondsNotice` (DATA-29). Вік каталогу (`updatedAt`) ніде не показується.
3. **НБУ повернув порожній масив.** `bonds = []` (не `null`), тож охоронці пропускають, а всі позиції стають `unknown` без виплат.
4. **НБУ прибрав ОВДП з каталогу.** Каталог замінюється цілком (DATA-11), тож позиції цієї ОВДП стають `unknown`: зникають їхні виплати й результати.
5. **Неочікувана відповідь.** Структура відповідей НБУ задається типами TypeScript без перевірки під час виконання; якщо контракт сервера зміниться, застосунок потребуватиме виправлення.
6. **Сьогоднішню ставку ще не опубліковано.** `fillDailyRates` заповнює сьогодні вчорашньою ставкою, і рік зберігається з `throughDate` = сьогодні; якщо ставка змінилася з сьогодні, застосунок покаже стару до наступного запиту (через 12 годин або на наступному запуску наступного дня).
7. **Новий день без перезапуску.** «Повнота» поточного року (DATA-14) перевіряється лише під час створення запиту; якщо запит уже в пам'яті, оновлення чекає `staleTime` 12 годин. `keyRateOn` тим часом дає ставку останнього збереженого дня (DATA-16).
8. **Майбутня дата.** Для ставки — сьогоднішня (DATA-15).
9. **Ранні роки.** Якщо НБУ не має ставки до 1 січня року (з запасом 14 днів), `fillDailyRates` кидає помилку, і цей рік не завантажується; для ставки — мовчки.
10. **Минулий рік, збережений як поточний.** Наприклад, 2025 рік, збережений 15.12.2025: у 2026 він «неповний» (`throughDate` < 2025-12-31), тож запит повториться один раз і далі не повторюватиметься (`staleTime: Infinity`).

## Покриття тестами

- `src/entities/portfolio/api/__tests__/dailyRates.test.ts`: DATA-13 (заповнення пропусків, помилка без рядка до першого дня).
- `src/entities/portfolio/api/__tests__/keyRate.test.ts`: DATA-16 (день року, день після `throughDate`, незавантажений рік).

**Без тестів:** DATA-01…DATA-12, DATA-14, DATA-15, DATA-17…DATA-31: мапінг відповідей НБУ, ключі сховищ, дії сховищ (`duplicateInvestmentPlan` з обрізанням назви, `createGoalPlan`, запасний активний план), параметри запитів, правило 5 хвилин, сповіщення про помилку, стани охоронців.

## Прогалини й питання

**GAP-DATA-02. Помилка автоматичного завантаження облікової ставки не пояснюється.** `useKeyRate` повертає ставку або `null`, не повідомляючи причину відсутності під час звичайного запиту. Ручне оновлення гаманця й плану також оновлює ставку та показує сповіщення в разі помилки. Доказ: `keyRateQuery.ts`, `useKeyRate.hook.ts`, `useWallet.hook.ts`. Серйозність: середня.

**GAP-DATA-03. Каталог замінюється цілком.** Якщо НБУ прибере ОВДП зі списку (наприклад, давно погашені) або поверне порожній масив, старі позиції втратять виплати й результати. Чи прибирає `depo_securities` погашені ОВДП — невідомо, варто перевірити на справжній відповіді. Доказ: `useBonds.hook.ts` (`saveBonds(fetched, …)`), `bonds/actions.ts`. Серйозність: середня.

**GAP-DATA-05. Сьогоднішня ставка «вгадується» і зберігається як справжня.** Див. крайній випадок 6–7: заповнений учорашньою ставкою сьогоднішній день зберігається з `throughDate` = сьогодні, а «новий день» перевіряється лише для нового запиту. У день зміни ставки підказки можуть до 12 годин порівнювати зі старою. Доказ: `nbuKeyRate.ts`, `keyRateQuery.ts`. Серйозність: низька.

**GAP-DATA-12. Недостатнє покриття мережевого шару й сховищ.** Не покриті мапінг відповідей НБУ, `keyRateQuery` (повнота року, `staleTime`), `notFailedRecently` і `onError` зі сповіщенням. Дії планів і запасний активний план частково перевіряє `plans.test.ts`. Доказ: розділ «Покриття тестами». Серйозність: середня.
