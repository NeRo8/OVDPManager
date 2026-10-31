# Доменна модель

**Що це й навіщо.** Тут описано, з чого складається облік у застосунку і як він рахує гроші: ОВДП з даних НБУ, купівлі, плани, позиції, гаманець, виплати, результати («Вкладено», «Усього виплат», «Чистий дохід», «Дохідність за весь строк»), «Річна дохідність», «Дохід» за проміжок часу, порівняння з обліковою ставкою НБУ та новими ОВДП, правила дат і округлення. Кожне правило описує те, що код робить сьогодні, щоб його можна було звірити з кодом і тестом. Терміни — з `GLOSSARY.md`.

## Звідки дані

- `src/entities/portfolio/model/portfolio.ts` — типи `Bond`, `BondPayment`, `Purchase`, `PlanPurchase`, `Position`, `PositionPayment`, `PurchaseEvent`, `ScheduleEvent`; `CURRENCIES`, `bondChoices`, `groupPositions`, `isPlannedPurchase`, `isRedeemed`, `canBuyOn`, `maturesWithin`, `pricePerBond`, `purchaseCurrency`, `positionCurrency`, `positionPayments`, `purchaseEvents`, `compareScheduleEvents`, `sumTotals`, `nextPayment`.
- `src/entities/portfolio/model/position.ts` — `PositionState`, `PositionResults`, `CurrencyResults`, `WalletPosition`, `hasRedemption`, `walletPosition`, `positionIncome`, `resultsByCurrency` (усередині: `withNetIncome`, `positionResults`, `positionYield`, `positionState`, `nominalLeft`, `redemptionCost`).
- `src/entities/portfolio/model/wallet.ts` — `Wallet`, `WalletScope`, `buildWallet`, `narrowWallet`, `walletScopeOptions`, `fitScope`.
- `src/entities/portfolio/model/yield.ts` — `annualYield`, `amountForYield`, `ANNUAL_YIELD_RANGE`.
- `src/entities/portfolio/model/market.ts` — `maturityTerm`, `NEW_BOND_MONTHS`, `MIN_NEW_BONDS`, `MAX_PLAUSIBLE_YIELD`, `newBondsRate`, `median`, `newBondsLabel`.
- `src/entities/portfolio/model/hints.ts`, `src/entities/portfolio/model/yieldHints.ts` — `Hint`, `Verdict`, `sortHints`, `worstTone`, `keyRateHint`, `newBondsHint`.
- `src/entities/portfolio/model/plan.ts` — `InvestmentPlan`, `CouponGoal`, `DEFAULT_PLAN_NAME`, `PLAN_NAME_MAX_LENGTH`; `src/entities/portfolio/model/counts.ts` — `purchaseCount`, `planCount`.
- `src/entities/portfolio/model/useWallet.hook.ts` — `useActivePurchases`, `useWallet`.
- `src/entities/portfolio/api/nbuBonds.ts` — як рядок НБУ стає `Bond` (детально — у `spec/data-and-sync.md`).
- `src/shared/lib/number.ts` (`round2`), `src/shared/lib/date.ts` (дати), `src/shared/lib/format.ts` (гроші, множина, розбір сум).

## Правила

### ОВДП (Bond)

**DOM-01.** `Bond` має поля: `isin`, `nominal` (номінал однієї ОВДП), `rate` (ставка купону, % на рік), `currency`, `issueDate` (дата розміщення), `maturityDate` (дата погашення), `description` (вид ОВДП текстом НБУ), `payments` (графік виплат на одну ОВДП: `{ date, type: 'coupon' | 'redemption', amount }`). `src/entities/portfolio/model/portfolio.ts`, тип `Bond`.

**DOM-02.** Каталог НБУ перетворюється на `Bond` так: `cpcode` → `isin` (обрізані пробіли, великі літери), `nominal` → `nominal`, `auk_proc` → `rate`, `razm_date` → `issueDate`, `pgs_date` → `maturityDate`, `cpdescr` → `description`, `val_code` → `currency`; кожен рядок `payments`: `pay_date` → `date`, `pay_type` `'1'` → `coupon`, `'2'` → `redemption`, `pay_val` → `amount` (на одну ОВДП, без округлення). `src/entities/portfolio/api/nbuBonds.ts`, `mapNbuSecurityToBond`.

**DOM-03.** Виплати ОВДП сортуються за датою, а в один день — купон перед погашенням (порівняння рядків `'coupon' < 'redemption'`). `mapNbuSecurityToBond`.

**DOM-04.** Застосунок залишає лише ОВДП у валютах `CURRENCIES = ['UAH', 'USD', 'EUR']`; ОВДП з будь-яким іншим `val_code` відкидається мовчки. Порядок `CURRENCIES` — це порядок валют у всіх підсумках. `fetchBonds`, `isSupportedCurrency`.

**DOM-05.** Каталог не відрізняє внутрішні ОВДП (`UA4000…`, номінал 1000) від ОЗДП (`XS…`, номінал 1, як зазначено в коментарі до `NbuSecurity`): обидва види потрапляють у каталог, якщо валюта підтримується. `src/entities/portfolio/api/nbuBonds.ts`.

**DOM-06.** ОВДП «опублікувала погашення», якщо серед її виплат є хоча б одна `redemption` (`hasRedemption`). Без цього графік виплат неповний: «Чистий дохід», «Дохідність за весь строк» і «Річна дохідність» не рахуються (див. DOM-27, DOM-30). `src/entities/portfolio/model/position.ts`, `hasRedemption`.

### Правила дат

**DOM-07.** Усі дати — рядки `YYYY-MM-DD`, порівнюються як рядки. «Сьогодні» — `todayISO()`: локальна календарна дата пристрою. `src/shared/lib/date.ts`.

**DOM-08.** ОВДП погашена (`isRedeemed`), коли `maturityDate < today`. У сам день погашення вона ще в обігу. Правило не залежить від того, чи НБУ опублікував погашення. Приклад: погашення 2026-03-15 — 15.03 «в обігу», 16.03 «погашено». `portfolio.ts`, `isRedeemed`.

**DOM-09.** Купівлю можна датувати днем `date` (`canBuyOn`), лише коли `date < maturityDate`. У день погашення купити вже не можна. `portfolio.ts`, `canBuyOn`.

**DOM-10.** `maturesWithin(bond, date, months)` істинне, коли `maturityDate <= addMonthsISO(date, months)`: останній день проміжку входить. `addMonthsISO` переносить число на той самий день через `months` місяців і притискає його до кінця коротшого місяця (31.01 + 1 → 28.02 або 29.02). `portfolio.ts`, `maturesWithin`; `date.ts`, `addMonthsISO`.

**DOM-11.** Строк до погашення (`maturityTerm`): `short` («до 1 року»), якщо `maturesWithin(…, 12)`; інакше `medium` («1–3 роки»), якщо `maturesWithin(…, 36)`; інакше `long` («понад 3 роки»). Приклад від 2026-10-29: погашення 2027-10-29 — `short`, 2027-10-30 — `medium`, 2029-10-29 — `medium`, 2029-10-30 — `long`. `market.ts`, `maturityTerm`.

**DOM-12.** Купівля запланована (`isPlannedPurchase`), коли `purchaseDate > today`. Купівля, датована сьогодні, уже вважається зробленою; підтвердження не потрібне. `portfolio.ts`, `isPlannedPurchase`.

**DOM-13.** `daysBetween(from, to)` — різниця календарних днів (`differenceInCalendarDays`), тож перехід на літній час день не зсуває. `date.ts`.

### Купівля і план

**DOM-14.** `Purchase` має поля `id`, `isin`, `purchaseDate`, `amount` (уся сума, списана за купівлю, у валюті ОВДП), `quantity`, `currency` (валюта ОВДП, запам'ятована під час додавання). `PlanPurchase` додає `planId`. `portfolio.ts`.

**DOM-15.** Валюта купівлі — валюта ОВДП з даних НБУ, якщо ОВДП там є; лише без неї береться збережене `purchase.currency` (`purchaseCurrency`). Валюта позиції — валюта її першої купівлі за тим самим правилом (`positionCurrency`). `portfolio.ts`.

**DOM-16.** «Ціна 1 шт» = `round2(amount / quantity)` (`pricePerBond`). Ділення на нуль не перевіряється: за `quantity = 0` результат `Infinity` або `NaN`. `portfolio.ts`, `pricePerBond`.

**DOM-17.** План — `InvestmentPlan { id, name, goal? }`. `goal` — `CouponGoal { currency, year, monthly }` («Ціль: купони на місяць»: валюта, «Рік купонів», купони на кожен місяць). Назва плану — до `PLAN_NAME_MAX_LENGTH = 80` символів; запропонована назва першого плану — «Мій план» (`DEFAULT_PLAN_NAME`). `src/entities/portfolio/model/plan.ts`.

**DOM-18.** Купівлі плану — це всі `PlanPurchase` з його `planId`; окремого списку запланованих купівель немає. Гаманець будується з купівель активного плану (`useActivePurchases`: `purchase.planId === plan?.id`). Без жодного плану гаманець порожній. `src/entities/portfolio/model/useWallet.hook.ts`.

**DOM-19.** `goal` задається лише під час створення плану (`createInvestmentPlan(name, goal)`), переходить у копію (`duplicateInvestmentPlan`, `createGoalPlan`), зберігається під час перейменування. Окремої дії змінити чи прибрати `goal` у плану немає. `src/entities/portfolio/model/plans/actions.ts`, `src/entities/portfolio/model/activePlan/actions.ts`.

### Позиція і право на виплати

**DOM-20.** Позиція (`groupPositions`) — усі купівлі одного ISIN серед переданих купівель. Позиції йдуть у порядку, у якому кожен ISIN уперше трапився в масиві купівель; купівлі в позиції сортуються за `purchaseDate` (у разі рівних дат лишається порядок масиву). `quantity` — сума кількостей без округлення; `investedAmount` — `round2` суми `amount`. `portfolio.ts`, `groupPositions`.

**DOM-21.** Право на виплату: для кожної виплати ОВДП рахуються лише купівлі, датовані **строго раніше** за дату виплати (`purchase.purchaseDate < payment.date`). Виплата в день купівлі належить попередньому власнику; докупівля починає заробляти з наступної виплати. Виплата з нульовою кількістю пропускається. `portfolio.ts`, `positionPayments`.

Формула для кожної виплати: `quantity = Σ quantity купівель із датою < дата виплати`; `total = round2(amount × quantity)`; `isPaid = payment.date < today`.

Приклад: купівля 2026-01-01, купон теж 2026-01-01 — купон у виплати позиції не потрапляє; перший купон — 2026-07-01.

**DOM-22.** Виплата «отримано» (`isPaid`), коли її дата строго раніше за сьогодні; виплата, датована сьогодні, ще очікується. `positionPayments`.

**DOM-23.** Наступна виплата позиції (`nextPayment`) — перша неотримана виплата в порядку графіка ОВДП; якщо купон і погашення в один день, це купон (DOM-03). `portfolio.ts`, `nextPayment`.

**DOM-24.** Стан позиції (`PositionState`, `positionState`) перевіряється в такому порядку: немає ОВДП у даних НБУ → `unknown`; усі купівлі заплановані (DOM-12) → `planned`; ОВДП погашена (DOM-08) → `redeemed`; інакше → `inCirculation`. Позиція із запланованою і зробленою купівлею — не `planned`. `position.ts`, `positionState`.

**DOM-25.** `walletPosition(position, bond, today)` дає `WalletPosition`: `position`, `bond` (немає, якщо ОВДП нема в даних НБУ), `currency` (DOM-15), `payments` (DOM-21; порожні без ОВДП), `nextPayment`, `state`, `results` (немає без ОВДП), `annualYield` (`null` без ОВДП). `position.ts`, `walletPosition`.

### Результати позиції (PositionResults)

**DOM-26.** Поля `PositionResults` позиції з ОВДП у даних НБУ (`positionResults`):

- `invested` = `position.investedAmount` (усі купівлі, разом із запланованими).
- `coupons` = `round2(Σ total виплат-купонів)` (DOM-21).
- `redemption` = `round2(Σ total виплат-погашень)`.
- `received` = `round2(Σ total виплат з isPaid)`.
- `expected` = `round2(Σ total виплат без isPaid)`.
- `totalPayments` = `round2(coupons + redemption)`.
- `complete` = `hasRedemption(bond)` (DOM-6).

`position.ts`, `positionResults`, `sumTotals`.

**DOM-27.** `netIncome` = `round2(totalPayments − invested)`, якщо `complete`, інакше `null`. `returnPercent` = `round2(netIncome / invested × 100)`, якщо `netIncome` не `null` і `invested` не нуль, інакше `null`. `position.ts`, `withNetIncome`.

Приклад (`position-test.ts`): ОВДП 10 %, номінал 1000, купони по 50 щопівроку з 2025-07-01 до 2027-01-01, погашення 1000 у 2027-01-01. Дві ОВДП куплено 2025-01-01 за 1980, сьогодні 2026-03-15: `invested` 1980, `coupons` 400, `redemption` 2000, `received` 200, `expected` 2200, `totalPayments` 2400, `netIncome` 420, `returnPercent` 21,21.

**DOM-28.** «Вартість погашення» (`redemptionCost`): для виплати-погашення — сума по купівлях, датованих раніше за неї, `purchase.amount × payment.amount / nominalLeft(bond, purchase.purchaseDate)`. `nominalLeft(bond, date)` = `bond.nominal − Σ amount погашень із датою <= date` (погашення в день купівлі належить попередньому власнику, тому вже відняте). Для ОВДП, погашеної одразу, це вся сума купівлі; для часткових погашень частки однієї купівлі в сумі дають її вартість, також для докупівлі між частковими погашеннями. `position.ts`, `nominalLeft`, `redemptionCost`.

**DOM-29.** «Дохід» позиції за проміжок `[from, to]`, обидва дні включно (`positionIncome`): `round2(купони проміжку + Σ (total погашення − redemptionCost) по погашеннях проміжку)`. Без ОВДП у даних НБУ — 0. `position.ts`, `positionIncome`.

Приклади (`position-test.ts`): ОВДП з DOM-27 за 2026 рік — 200 (лише купони); за 2027 рік — 120 (купони 100 + погашення 2000 − 1980). ОВДП, що гаситься двома частинами по 500 (2026-01-01 і 2027-01-01): купівля 2025-01-01 за 990 і докупівля 2026-06-01 за 495; дохід за весь час = (500 − 990 × ½) + (1000 − (990 × ½ + 495 × 1)) = 15.

**DOM-30.** «Річна дохідність» позиції (`positionYield`): `null`, якщо погашення не опубліковано. Інакше для кожної купівлі окремо рахується `annualYield(amount, purchaseDate, виплати лише цієї купівлі за DOM-21)`; якщо хоч одна купівля дає `null`, уся позиція дає `null`. Результат — `round2(Σ (дохідність × amount) / investedAmount)`. Заплановані купівлі входять. `position.ts`, `positionYield`.

### Підсумки за валютою (resultsByCurrency)

**DOM-31.** `resultsByCurrency(positions)` іде валютами в порядку `CURRENCIES`. До валюти потрапляють лише позиції з `results` (тобто з ОВДП у даних НБУ); валюта без жодної такої позиції пропускається. Позиції без даних НБУ ні в чому не враховуються і не рахуються окремо. `position.ts`, `resultsByCurrency`.

**DOM-32.** `invested`, `coupons`, `redemption`, `received`, `expected`, `totalPayments` — `round2` сум відповідних полів **усіх** позицій валюти з даними НБУ. `complete` — чи в усіх цих позицій опубліковано погашення. `incompleteCount` — скільки позицій без опублікованого погашення. `resultsByCurrency`.

**DOM-33.** `netIncome` і `returnPercent` валюти рахуються лише за позиціями з опублікованим погашенням: `netIncome = round2(round2(Σ totalPayments опублікованих) − round2(Σ invested опублікованих))`, `returnPercent` — від `invested` лише опублікованих. Якщо опублікованих немає — обидва `null`. Тож поруч стоять `invested` усіх позицій і `netIncome` лише частини з них. Приклад (`position-test.ts`): позиція 1000 → 1200 і позиція без погашення за 1000: `invested` 2000, `netIncome` 200, `returnPercent` 20, `incompleteCount` 1. `resultsByCurrency`.

**DOM-34.** `annualYield` валюти — середня «Річна дохідність» позицій, у яких вона є (не `null`), зважена на `position.investedAmount`, з `round2`; `null`, якщо таких позицій немає. Позиції з `null`-дохідністю відкидаються мовчки й не потрапляють до `incompleteCount`. `resultsByCurrency`.

### Гаманець (Wallet)

**DOM-35.** `buildWallet(purchases, byIsin, today)` будує всі поля з купівель: `positions` = `groupPositions(purchases)` → `walletPosition` (DOM-25); `payments` — виплати всіх позицій, відсортовані лише за датою (у межах дати зберігається порядок позицій, а в позиції — порядок графіка ОВДП); `purchaseEvents` — кожна купівля як подія (DOM-36); а також `purchases`, `byIsin`, `today`. Виплат ОВДП, яких немає в даних НБУ, немає. `wallet.ts`, `buildWallet`.

**DOM-36.** Подія купівлі (`purchaseEvents`): `type: 'purchase'`, `id`, `date = purchaseDate`, `isin`, `currency` (DOM-15), `quantity`, `total = amount` (без округлення), `isTopUp` — `true` для кожної купівлі позиції, крім найранішої (у разі однакових дат — крім першої в масиві). Події сортуються за датою; входять і купівлі ОВДП, яких немає в даних НБУ. `portfolio.ts`, `purchaseEvents`.

**DOM-37.** Порядок подій розкладу (`compareScheduleEvents`): за датою, а в один день виплата перед купівлею. `portfolio.ts`.

**DOM-38.** `narrowWallet(wallet, { currency, isins })` залишає купівлі, у яких (`currency === null` або валюта купівлі за DOM-15 дорівнює `currency`) і (`isins` порожній або містить ISIN купівлі), і будує з них новий гаманець через `buildWallet` з тими самими `byIsin` і `today`. З `{ currency: null, isins: [] }` гаманець дорівнює вихідному. `wallet.ts`, `narrowWallet`.

**DOM-39.** `walletScopeOptions(wallet)`: `isins` — ISIN позицій, чия ОВДП є в даних НБУ, відсортовані за абеткою; `currencies` — валюти з `CURRENCIES`, що трапляються серед виплат або подій купівлі гаманця (фактично — валюти всіх купівель, бо кожна купівля дає подію). `wallet.ts`, `walletScopeOptions`.

**DOM-40.** `fitScope(scope, options)` підганяє збережений вибір до гаманця: ISIN, яких немає в `options.isins`, відкидаються; валюта, якої немає в `options.currencies`, стає `null` («усі валюти»). Інші поля `scope` лишаються. (Фільтри виплат замінюють відсутню валюту на першу наявну — це їхнє власне правило поза `fitScope`.) `wallet.ts`, `fitScope`.

**DOM-41.** `useWallet()` = `buildWallet(купівлі активного плану, byIsin з useBonds, todayISO())` плюс `plan`, `bonds` (увесь каталог або `null`) і `refresh`. `today` береться під час рендеру. `src/entities/portfolio/model/useWallet.hook.ts`.

**DOM-42.** Вибір ОВДП для купівлі (`bondChoices(bonds, query, today)`): запит очищається від пробілів і переводиться у великі літери. Без запиту — лише ОВДП, які можна купити сьогодні (DOM-9). Із запитом — усі ОВДП, чий ISIN містить запит, також погашені. Спершу ті, що можна купити, далі — за `maturityDate`. `portfolio.ts`, `bondChoices`.

### Річна дохідність і ціна для дохідності

**DOM-43.** `annualYield(amount, purchaseDate, payments)` — ставка `r` (частка на рік, виплачувана двома половинами), за якої дисконтовані виплати дорівнюють сумі купівлі:

`amount = Σ total_i / (1 + r/2)^(h_i)`, де `h_i = daysBetween(purchaseDate, date_i) / 365 × 2` (півроки).

Пошук — бісекцією на `[−0,99; 10,00]` (тобто −99…1000 %, `ANNUAL_YIELD_RANGE`), 100 кроків, результат `round2(r × 100)` у відсотках. `src/entities/portfolio/model/yield.ts`, `annualYield`.

**DOM-44.** `annualYield` дає `null`, якщо `amount <= 0`, виплат немає, вартість виплат за −99 % менша за `amount` (дохідність нижча за −99 %) або вартість за 1000 % більша за `amount` (дохідність вища за 1000 %). `annualYield`.

**DOM-45.** `amountForYield(date, payments, yieldPercent)` = `round2(Σ total_i / (1 + yieldPercent/100/2)^(h_i))` з тим самим відліком півроків від `date`: сума, за якої купівля (або утримання) дає цю дохідність. Обернена до DOM-43: `annualYield(amountForYield(d, p, 15), d, p) ≈ 15`. Купівля за номіналом у день купона ОВДП зі ставкою 16 % при `yieldPercent = 16` дає ≈ 1000 (у межах ±5 через рахунок за 365 днів). `yield.ts`, `amountForYield`; `market-test.ts`.

**DOM-46.** `MAX_PLAUSIBLE_YIELD = 40` (%): дохідність вище за це вважається радше помилкою в сумі чи кількості. Сама модель її не застосовує; її використовують форма купівлі (`assessPurchase`, «Перевірте суму») і екран продажу (`holdOrSell`). `market.ts`.

### Нові ОВДП

**DOM-47.** `newBondsRate(bond, date, bonds)` шукає «нові ОВДП» для порівняння: інші ОВДП (`isin` відрізняється) тієї самої валюти, з `issueDate > addMonthsISO(date, −12)` і `issueDate <= date`, які ще можна купити на `date` (DOM-9), і з тим самим `maturityTerm` на `date`, що й `bond`. Якщо їх менше за `MIN_NEW_BONDS = 2` — `null`. Інакше `{ rate: median(їхніх rate), count, term }`. `NEW_BOND_MONTHS = 12`. `market.ts`, `newBondsRate`.

**DOM-48.** `median`: для непарної кількості — середній елемент як є; для парної — `round2` середнього двох середніх. `market.ts`, `median`.

**DOM-49.** Нові ОВДП словами (`newBondsLabel`): «<count> ОВДП у <код валюти> зі строком <до 1 року | 1–3 роки | понад 3 роки>, розміщених за останні 12 місяців», напр. «12 ОВДП у UAH зі строком 1–3 роки, розміщених за останні 12 місяців». `market.ts`.

### Підказки (hints)

**DOM-50.** Підказка — `Hint { tone, text }`, `tone` ∈ `success | info | warning | error`. Вага: `info` 0, `success` 1, `warning` 2, `error` 3. `sortHints` прибирає `null` і сортує від найсерйознішої (сортування стабільне — рівні зберігають порядок). `worstTone` — найсерйозніший тон, `info` для порожнього списку. `Verdict { tone: success | warning | error, title }` — підсумок над підказками. `src/entities/portfolio/model/hints.ts`.

**DOM-51.** Порівняння з обліковою ставкою (`keyRateHint(annualYield, keyRate, currency, errorGap?)`): `null`, якщо валюта не `UAH` або ставки немає. `gap = round2(keyRate − annualYield)`. Якщо `gap > 1` (`WARNING_GAP`): тон `error`, коли задано `errorGap` і `gap > errorGap`, інакше `warning`; текст «Річна дохідність X% на G п.п. нижча за облікову ставку НБУ (K%): депозит чи нова ОВДП можуть дати більше.» Якщо `gap < 0`: `success`, «Річна дохідність X% вища за облікову ставку НБУ (K%).» Якщо `0 <= gap <= 1`: `success`, «Річна дохідність X% близька до облікової ставки НБУ (K%).» `src/entities/portfolio/model/yieldHints.ts`.

Приклад: дохідність 14, ставка 15,5 → `gap` 1,5 → `warning`; з `errorGap = 3` (форма купівлі) дохідність 12 → `gap` 3,5 → `error`. Екран продажу передає `keyRateHint` без `errorGap`, тож там `error` не буває.

**DOM-52.** Порівняння з новими ОВДП (`newBondsHint(annualYield, newBonds, currency)`): `null` без нових ОВДП. `gap = round2(newBonds.rate − annualYield)`. `gap > 1` → `warning`: «Річна дохідність X% на G п.п. нижча за середню ставку купону (R%) <newBondsLabel>: нова ОВДП може дати більше.» `gap < 0` → `success`, «… вища за середню ставку купону (R%) <label>.»; `0 <= gap <= 1` → `success`, «… близька до середньої ставки купону (R%) <label>.» Тону `error` тут немає; валюта не обмежена. `yieldHints.ts`.

**DOM-53.** Числа в текстах підказок підставляються як JavaScript-числа (`${annualYield}%`), тобто з десятковою крапкою («14.5%»), а не через `formatAmount`. `yieldHints.ts`.

### Округлення, формат і лічильники

**DOM-54.** `round2(value)` округлює до копійок «від нуля»: спершу `|value| × 100` зводиться до 15 значущих цифр (щоб 1.005 → 1.01), потім `Math.round`; від'ємний знак повертається, лише якщо копійок не нуль (без «−0,00»). `src/shared/lib/number.ts`.

**DOM-55.** Округлення виконується на кожному рівні: виплата позиції (`total`), суми за типом (`sumTotals`), `investedAmount`, `totalPayments`, `netIncome`, `returnPercent`, підсумки валюти; `annualYield` і `median` (парний) — теж до сотих. Сума `amount` купівлі і `total` події купівлі не округлюються. `portfolio.ts`, `position.ts`.

**DOM-56.** Гроші форматуються `uk-UA` з рівно двома знаками після коми: `formatMoney(10200.5, 'UAH')` → «10 200,50 ₴»; знаки валют ₴, $, €, для іншої валюти — її код. `formatTotals` додає суми по валютах окремо: «10 200,00 ₴ + 5 000,00 $». `src/shared/lib/format.ts`.

**DOM-57.** Українська множина (`plural`): `n % 10 = 1` і `n % 100 ≠ 11` → форма «один»; `n % 10` у 2–4 і `n % 100` не в 12–14 → «кілька»; інакше → «багато». `purchaseCount(5)` → «5 купівель», `planCount(2)` → «2 плани». `format.ts`, `counts.ts`.

**DOM-58.** `parseAmount(text)` прибирає пробіли (і нерозривні), замінює **першу** кому на крапку й повертає `Number(...)`; порожній рядок → `NaN`. `format.ts`.

## Стани

- **Немає ОВДП у даних НБУ** (каталог ще не завантажено або ISIN там відсутній): позиція `unknown`, без виплат, `results` і дохідності; її купівлі все одно є серед `purchaseEvents` і рахуються у валюті `purchase.currency`; `resultsByCurrency` її пропускає; `positionIncome` дає 0.
- **Погашення ще не опубліковано**: `complete: false`, `netIncome`/`returnPercent`/`annualYield` — `null`; виплати-купони й суми `coupons`, `received`, `expected` рахуються.
- **Порожній план**: `buildWallet([])` дає порожні масиви; `resultsByCurrency` — порожній список.

## Крайні випадки

1. **Купівля в день купона / погашення.** Виплата цього дня не належить купівлі (DOM-21). Купівлю в день погашення форма не дозволяє (DOM-9), але якщо вона є (з резервної копії), позиція не має виплат: `coupons = redemption = 0`, і за опублікованого погашення `netIncome = −invested`, а `annualYield` — `null`.
2. **День погашення.** ОВДП ще `inCirculation`, погашення ще не `isPaid` (DOM-8, DOM-22); з наступного дня — `redeemed` і `isPaid`.
3. **Часткові погашення.** `redemption` — сума всіх часткових; `redemptionCost` ділить вартість купівлі за залишком номіналу на дату купівлі (DOM-28). Докупівля в день часткового погашення не отримує його і рахується від уже зменшеного залишку.
4. **Купівля, датована сьогодні**, — зроблена, не запланована (DOM-12); виплата, датована сьогодні, — не отримана (DOM-22).
5. **Нульова кількість або сума.** Моделі цього не перевіряють: `pricePerBond` ділить на нуль; позиція з `quantity = 0` не має виплат; `annualYield` для `amount <= 0` — `null`, отже вся позиція без дохідності; якщо `investedAmount = 0`, у `positionYield` ділення на нуль (`NaN`/`Infinity`), а `returnPercent` — `null`. Форма такого не пропускає, але резервна копія не перевіряється (див. `spec/backup-settings-onboarding.md`).
6. **Інші валюти.** `keyRateHint` для не-`UAH` — `null`; `newBondsRate` бере ОВДП лише тієї самої валюти. ОВДП не в UAH/USD/EUR до застосунку не потрапляють.
7. **Валюта купівлі не збігається з валютою ОВДП.** Виграє валюта ОВДП з даних НБУ (DOM-15); `purchase.currency` лишається лише як запасна.
8. **Дублікати ISIN у каталозі НБУ.** `byIsin` — `Map`, тож останній рядок перезаписує попередні; список `bonds` містить обидва.
9. **Позиція з однією купівлею без дохідності** (поза діапазоном −99…1000 %) робить `null` дохідність усієї позиції (DOM-30), а у валюті ця позиція випадає з середньої (DOM-34).
10. **Без планів** `useActivePlan()` — `undefined`, гаманець порожній; екрани до цього не доходять (див. охоронці в `spec/backup-settings-onboarding.md`).
11. **Опівночі.** `today` у `useWallet` береться під час рендеру; якщо нічого не перерендерює екран, `isPaid`, стан і «заплановано» лишаються вчорашніми до наступного рендеру.
12. **Високосний рік.** Півроки рахуються як `дні / 365 × 2` (DOM-43), тож 366-денний рік дає трохи більше двох півроків.

## Покриття тестами

- `src/entities/portfolio/model/__tests__/bondDates-test.ts`: DOM-08, DOM-09, DOM-10, DOM-42.
- `src/entities/portfolio/model/__tests__/market-test.ts`: DOM-11, DOM-45, DOM-47 (з DOM-48 для парної кількості — неявно, медіана двох значень), DOM-49.
- `src/entities/portfolio/model/__tests__/position-test.ts`: DOM-21 (купон у день купівлі), DOM-24, DOM-25 (без даних НБУ), DOM-26, DOM-27, DOM-29 (з DOM-28 для часткових погашень), DOM-30, DOM-31, DOM-32, DOM-33, DOM-34.
- `src/entities/portfolio/model/__tests__/wallet-test.ts`: DOM-20 (порядок позицій), DOM-35, DOM-36 (порядок подій, купівля без даних НБУ), DOM-38.
- `src/features/payment-filters/model/__tests__/filterSchedule-test.ts`: DOM-37, DOM-39 (опосередковано).
- `src/features/report-filters/model/__tests__/fitReportFilters-test.ts`: DOM-40 (опосередковано, через `fitReportFilters`).
- `src/features/add-purchase/model/__tests__/purchaseHints-test.ts`: DOM-51, DOM-52, DOM-46 (опосередковано, через `assessPurchase`).
- `src/pages/holdings/model/__tests__/holdOrSell-test.ts`: DOM-45, DOM-51/DOM-52 без `errorGap` (опосередковано).

**Без тестів:** DOM-02, DOM-03, DOM-04, DOM-05 (`mapNbuSecurityToBond`, `fetchBonds`), DOM-06 окремо, DOM-12 окремо, DOM-13, DOM-15, DOM-16, DOM-19, DOM-22 (межа «сьогодні»), DOM-23, DOM-36 (`isTopUp`), DOM-41, DOM-43/DOM-44 (межі `null` у `annualYield` напряму), DOM-50 (`sortHints`, `worstTone`), DOM-53, DOM-54 (`round2`), DOM-56, DOM-57, DOM-58 (`parseAmount`).

## Прогалини й питання

**GAP-DOM-01. ОЗДП змішані з ОВДП.** Каталог залишає `XS…` ОЗДП з номіналом 1 разом із внутрішніми ОВДП (DOM-05). Вони з'являються у виборі ОВДП і, головне, входять до `newBondsRate` для USD/EUR, де медіана ставок може змішати два різні ринки. Варто з'ясувати, чи це задумано і чи `GLOSSARY.md` («номінал зазвичай 1 000») це передбачає. Доказ: `src/entities/portfolio/api/nbuBonds.ts`, `fetchBonds`; `market.ts`, `newBondsRate`. Серйозність: середня.

**GAP-DOM-02. Позиції без даних НБУ зникають з підсумків без лічильника.** `resultsByCurrency` пропускає їх повністю (DOM-31): «Вкладено» валюти менше, ніж справді заплачено, а `CurrencyResults` не каже, скільки позицій випало (є лише `incompleteCount` для неопублікованих погашень). Екран мусить рахувати це сам. Доказ: `position.ts`, `resultsByCurrency`. Серйозність: середня.

**GAP-DOM-03. «Вкладено» і «Чистий дохід» валюти з різних наборів позицій.** `invested` — усі позиції, `netIncome`/`returnPercent` — лише з опублікованим погашенням (DOM-33). Якщо екран покаже «Вкладено» і поруч «Дохідність за весь строк», читач подумає, що одне ділиться на інше. Доказ: `resultsByCurrency`. Серйозність: низька (задумано, але легко неправильно показати).

**GAP-DOM-04. Середня «Річна дохідність» мовчки відкидає позиції з `null`.** Позиції без опублікованого погашення або з дохідністю поза −99…1000 % не входять у середню, а лічильника для цього немає (DOM-34). Доказ: `resultsByCurrency`, `withYield`. Серйозність: низька.

**GAP-DOM-05. Одна «погана» купівля обнуляє дохідність усієї позиції.** Якщо будь-яка купівля позиції дає `null` (наприклад, купівля без виплат після неї), `positionYield` повертає `null` для всієї позиції, хоча інші купівлі мають дохідність (DOM-30). Доказ: `position.ts`, `positionYield`. Серйозність: низька.

**GAP-DOM-06. Ділення на нуль у позиції з нульовою сумою.** `positionYield` ділить на `investedAmount` без перевірки, `pricePerBond` — на `quantity`. Форма захищає, а відновлена резервна копія — ні. Доказ: `position.ts`, `positionYield`; `portfolio.ts`, `pricePerBond`. Серйозність: низька.

**GAP-DOM-07. «Середня ставка купону» насправді медіана.** `newBondsHint` пише «середню/середньої ставки купону», а `newBondsRate` рахує медіану (DOM-47, DOM-52). Для кількох ОВДП з різкими ставками числа відрізняються. `GLOSSARY.md` не має терміна для цього числа. Доказ: `yieldHints.ts`, `newBondsHint`; `market.ts`, `median`. Серйозність: низька.

**GAP-DOM-08. Десяткова крапка в текстах підказок.** «Річна дохідність 14.5% на 1.5 п.п.» замість «14,5 %» — решта застосунку форматує `uk-UA` з комою (DOM-53, DOM-56). Доказ: `yieldHints.ts`. Серйозність: низька.

**GAP-DOM-09. `today` не оновлюється сам опівночі.** `useWallet` бере `todayISO()` під час рендеру (DOM-41); відкритий після півночі екран показує вчорашні «отримано», «заплановано» і стани до наступного рендеру. Доказ: `useWallet.hook.ts`. Серйозність: низька.

**GAP-DOM-10. Ціль не можна змінити на місці.** Немає дії, що змінює чи прибирає `goal` плану (DOM-19); перерахунок цілі з «Плану з ціллю» робить копію копії (`createGoalPlan` копіює всі купівлі активного плану, разом із попередніми купівлями під ціль, і додає суфікс ще раз: «Мій план · ціль 2027 · ціль 2027»). Перевірити разом зі специфікацією цілі. Доказ: `src/entities/portfolio/model/activePlan/actions.ts`, `createGoalPlan`; `src/features/coupon-goal/model/useCouponGoal.hook.ts`. Серйозність: середня.

**GAP-DOM-11. Рівні дати купівель — `isTopUp` залежить від порядку масиву.** Дві купівлі одного ISIN в один день: «докупівлею» стає та, що пізніше додана в масив (DOM-36), а після відновлення копії порядок може бути інший. Доказ: `portfolio.ts`, `groupPositions`, `purchaseEvents`. Серйозність: низька.

**GAP-DOM-12. Правила `parseAmount` для «1,000,50».** Замінюється лише перша кома, тож «1,000,50» → `Number('1.000,50')` = `NaN`; англійський формат «1,000.50» → `NaN`. Це поведінка форм, але функція спільна. Доказ: `src/shared/lib/format.ts`, `parseAmount`. Серйозність: низька.

**GAP-DOM-13. Багато чистих функцій без тестів.** Не покриті `round2`, межі `annualYield` (`null`), `sortHints`/`worstTone`, `mapNbuSecurityToBond` (сортування виплат, відкидання валют), `isTopUp`, `nextPayment`. Доказ: розділ «Покриття тестами». Серйозність: середня.
