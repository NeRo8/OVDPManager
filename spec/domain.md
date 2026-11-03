# Доменна модель

**Що це й навіщо.** Тут описано, з чого складається облік у застосунку і як він рахує гроші: ОВДП з даних НБУ, купівлі, плани, позиції, гаманець, виплати, результати («Вкладено», «Усього виплат», «Чистий дохід», «Дохідність за весь строк»), «Річна дохідність», «Дохід» за проміжок часу, порівняння з обліковою ставкою НБУ та новими ОВДП, правила дат і округлення. Кожне правило описує те, що код робить сьогодні, щоб його можна було звірити з кодом і тестом. Терміни — з `GLOSSARY.md`.

## Звідки дані

- `src/lib/portfolio/portfolio.ts` — типи `Bond`, `BondPayment`, `Purchase`, `PlanPurchase`, `Position`, `PositionPayment`, `PurchaseEvent`, `ScheduleEvent`; `CURRENCIES`, `bondChoices`, `groupPositions`, `isPlannedPurchase`, `isRedeemed`, `canBuyOn`, `maturesWithin`, `pricePerBond`, `purchaseCurrency`, `positionCurrency`, `positionPayments`, `purchaseEvents`, `compareScheduleEvents`, `sumTotals`, `nextPayment`.
- `src/lib/portfolio/position.ts` — `PositionState`, `PositionResults`, `CurrencyResults`, `WalletPosition`, `hasRedemption`, `walletPosition`, `resultsByCurrency` (усередині: `netIncomeOf`, `positionResults`, `positionYield`, `positionState`, `plannedPart`).
- `src/lib/portfolio/wallet.ts` — `Wallet`, `buildWallet`, `WalletScopeOptions`, `walletScopeOptions`, `isinsIn`.
- `src/lib/portfolio/yield.ts` — `annualYield`, `amountForYield`, `ANNUAL_YIELD_RANGE`.
- `src/lib/portfolio/market.ts` — `maturityTerm`, `NEW_BOND_MONTHS`, `MIN_NEW_BONDS`, `MAX_PLAUSIBLE_YIELD`, `newBondsRate`, `median`, `newBondsLabel`.
- `src/lib/portfolio/hints.ts`, `src/lib/portfolio/yieldHints.ts` — `Hint`, `Verdict`, `sortHints`, `worstTone`, `keyRateHint`, `newBondsHint`.
- `src/lib/portfolio/plan.ts` — `InvestmentPlan`, `DEFAULT_PLAN_NAME`, `PLAN_NAME_MAX_LENGTH`; `src/lib/portfolio/counts.ts` — `purchaseCount`, `planCount`.
- `src/hooks/useWallet.hook.ts` — `useWallet`; `src/stores/activePlan/` — `useActivePlan`, `getActivePlan`, `useActivePurchases`, `getActivePurchases`.
- `src/api/nbu/nbuBonds.ts` — як рядок НБУ стає `Bond` (детально — у `spec/data-and-sync.md`).
- `src/utils/number.ts` (`round2`), `src/utils/date.ts` (дати), `src/utils/format.ts` (гроші, множина, розбір сум).

## Правила

### ОВДП (Bond)

**DOM-01.** `Bond` має поля: `isin`, `nominal` (номінал однієї ОВДП), `rate` (ставка купону, % на рік), `currency`, `issueDate` (дата розміщення), `maturityDate` (дата погашення), `description` (вид ОВДП текстом НБУ), `payments` (графік виплат на одну ОВДП: `{ date, type: 'coupon' | 'redemption', amount }`). `src/lib/portfolio/portfolio.ts`, тип `Bond`.

**DOM-02.** Каталог НБУ перетворюється на `Bond` так: `cpcode` → `isin` (обрізані пробіли, великі літери), `nominal` → `nominal`, `auk_proc` → `rate`, `razm_date` → `issueDate`, `pgs_date` → `maturityDate`, `cpdescr` → `description`, `val_code` → `currency`; кожен рядок `payments`: `pay_date` → `date`, `pay_type` `'1'` → `coupon`, `'2'` → `redemption`, `pay_val` → `amount` (на одну ОВДП, без округлення). `src/api/nbu/nbuBonds.ts`, `mapNbuSecurityToBond`.

**DOM-03.** Виплати ОВДП сортуються за датою, а в один день — купон перед погашенням (порівняння рядків `'coupon' < 'redemption'`). `mapNbuSecurityToBond`.

**DOM-04.** Застосунок залишає лише ОВДП у валютах `CURRENCIES = ['UAH', 'USD', 'EUR']`; ОВДП з будь-яким іншим `val_code` відкидається мовчки. Порядок `CURRENCIES` — це порядок валют у всіх підсумках. `fetchBonds`, `isSupportedCurrency`.

**DOM-05.** Каталог не відрізняє внутрішні ОВДП (`UA4000…`, номінал 1000) від ОЗДП (`XS…`, номінал 1, як зазначено в коментарі до `NbuSecurity`): обидва види потрапляють у каталог, якщо валюта підтримується. `src/api/nbu/nbuBonds.ts`.

**DOM-06.** ОВДП «опублікувала погашення», якщо серед її виплат є хоча б одна `redemption` (`hasRedemption`). Без цього графік виплат неповний: «Чистий дохід», «Дохідність за весь строк» і «Річна дохідність» не рахуються (див. DOM-27, DOM-30). `src/lib/portfolio/position.ts`, `hasRedemption`.

### Правила дат

**DOM-07.** Усі дати — рядки `YYYY-MM-DD`, порівнюються як рядки. «Сьогодні» — локальна календарна дата пристрою (`todayISO()`), яку `refreshToday` записує у сховище налаштувань; екрани, рядки й запити читають її лише через `useToday()` (DOM-41), тож один екран ніколи не бачить двох різних «сьогодні». `src/utils/date.ts`, `src/stores/appSettings/`.

**DOM-08.** ОВДП погашена (`isRedeemed`), коли `maturityDate < today`. У сам день погашення вона ще в обігу. Правило не залежить від того, чи НБУ опублікував погашення. Приклад: погашення 2026-03-15 — 15.03 «в обігу», 16.03 «погашено». `portfolio.ts`, `isRedeemed`.

**DOM-09.** Купівлю можна датувати днем `date` (`canBuyOn`), лише коли `date < maturityDate`. У день погашення купити вже не можна. `portfolio.ts`, `canBuyOn`.

**DOM-10.** `maturesWithin(bond, date, months)` істинне, коли `maturityDate <= addMonthsISO(date, months)`: останній день проміжку входить. `addMonthsISO` переносить число на той самий день через `months` місяців і притискає його до кінця коротшого місяця (31.01 + 1 → 28.02 або 29.02). `portfolio.ts`, `maturesWithin`; `date.ts`, `addMonthsISO`.

**DOM-11.** Строк до погашення (`maturityTerm`): `short` («до 1 року»), якщо `maturesWithin(…, 12)`; інакше `medium` («1–3 роки»), якщо `maturesWithin(…, 36)`; інакше `long` («понад 3 роки»). Приклад від 2026-10-29: погашення 2027-10-29 — `short`, 2027-10-30 — `medium`, 2029-10-29 — `medium`, 2029-10-30 — `long`. `market.ts`, `maturityTerm`.

**DOM-12.** Купівля запланована (`isPlannedPurchase`), коли `purchaseDate > today`. Купівля, датована сьогодні, уже вважається зробленою; підтвердження не потрібне. `portfolio.ts`, `isPlannedPurchase`.

**DOM-13.** `daysBetween(from, to)` — різниця календарних днів (`differenceInCalendarDays`), тож перехід на літній час день не зсуває. `date.ts`.

### Купівля і план

**DOM-14.** `Purchase` має поля `id`, `isin`, `purchaseDate`, `amount` (уся сума, списана за купівлю, у валюті ОВДП), `quantity`, `currency` (валюта ОВДП, запам'ятована під час додавання). `PlanPurchase` додає `planId`. `portfolio.ts`.

**DOM-15.** Валюта купівлі — валюта ОВДП з даних НБУ, якщо ОВДП там є; лише без неї береться збережене `purchase.currency` (`purchaseCurrency`). Валюта позиції — валюта її першої купівлі за тим самим правилом (`positionCurrency`). `portfolio.ts`.

**DOM-16.** «Ціна 1 шт» = `round2(amount / quantity)` (`pricePerBond`). За недодатної кількості повертається `null`. `portfolio.ts`, `pricePerBond`.

**DOM-17.** План — `InvestmentPlan { id, name, isActive }`. Назва плану — до `PLAN_NAME_MAX_LENGTH = 80` символів; запропонована назва першого плану — «Мій план» (`DEFAULT_PLAN_NAME`). `src/lib/portfolio/plan.ts`.

**DOM-18.** Купівлі плану — це всі `PlanPurchase` з його `planId`; окремого списку запланованих купівель немає. Гаманець будується з купівель активного плану (`useActivePurchases`: `purchase.planId === plan?.id`). Без жодного плану гаманець порожній. `src/hooks/useWallet.hook.ts`.

### Позиція і право на виплати

**DOM-20.** Позиція (`groupPositions`) — усі купівлі одного ISIN серед переданих купівель. Позиції йдуть у порядку, у якому кожен ISIN уперше трапився в масиві купівель; купівлі в позиції сортуються за `purchaseDate` (у разі рівних дат лишається порядок масиву). `quantity` — сума кількостей без округлення; `investedAmount` — `round2` суми `amount`. `portfolio.ts`, `groupPositions`.

**DOM-21.** Право на виплату: для кожної виплати ОВДП рахуються лише купівлі, датовані **строго раніше** за дату виплати (`purchase.purchaseDate < payment.date`). Виплата в день купівлі належить попередньому власнику; докупівля починає заробляти з наступної виплати. Виплата з нульовою кількістю пропускається. `portfolio.ts`, `positionPayments`.

Формула для кожної виплати: `quantity = Σ quantity купівель із датою < дата виплати`; `plannedQuantity = Σ quantity тих із них, що ще заплановані` (DOM-12: `purchaseDate > today`); `total = round2(amount × quantity)`; `isPaid = payment.date < today`.

Приклад: купівля 2026-01-01, купон теж 2026-01-01 — купон у виплати позиції не потрапляє; перший купон — 2026-07-01.

**DOM-59.** `plannedQuantity` виплати (`PositionPayment`) — скільки з її `quantity` припадає на купівлі, яких ще не зроблено: купівлі, датовані раніше за виплату (DOM-21) і пізніше за сьогодні (DOM-12). Отримана виплата завжди має `plannedQuantity = 0`: її дата раніше за сьогодні, тож і всі купівлі до неї вже зроблені. Приклад від 2026-10-31: куплено 2 шт 2026-03-01 і заплановано 3 шт на 2026-12-01; купон 2027-01-15 має `quantity = 5`, `plannedQuantity = 3`; купон 2026-11-15 — `quantity = 2`, `plannedQuantity = 0`. З цього рядки виплат пишуть «заплановано» (див. `ScheduleEventRow` у [screens/payments.md](screens/payments.md)). `portfolio.ts`, `positionPayments`.

**DOM-22.** Виплата «отримано» (`isPaid`), коли її дата строго раніше за сьогодні; виплата, датована сьогодні, ще очікується. `positionPayments`.

**DOM-23.** Наступна виплата позиції (`nextPayment`) — перша неотримана виплата в порядку графіка ОВДП; якщо купон і погашення в один день, це купон (DOM-03). `portfolio.ts`, `nextPayment`.

**DOM-24.** Стан позиції (`PositionState`, `positionState`) перевіряється в такому порядку: немає ОВДП у даних НБУ → `unknown`; усі купівлі заплановані (DOM-12) → `planned`; ОВДП погашена (DOM-08) → `redeemed`; інакше → `inCirculation`. Позиція із запланованою і зробленою купівлею — не `planned`. `position.ts`, `positionState`.

**DOM-25.** `walletPosition(position, bond, today)` дає `WalletPosition`: `position`, `bond` (немає, якщо ОВДП нема в даних НБУ), `currency` (DOM-15), `payments` (DOM-21; порожні без ОВДП), `nextPayment`, `state`, `results` (немає без ОВДП), `annualYield` (`null` без ОВДП), `planned` (DOM-60; є й без ОВДП). `position.ts`, `walletPosition`.

**DOM-60.** Запланована частина позиції (`WalletPosition.planned`, `plannedPart`): `{ quantity, amount }` — сума кількостей і `round2` суми `amount` купівель позиції, ще запланованих на сьогодні (DOM-12: `purchaseDate > today`); коли всі купівлі зроблені — `{ quantity: 0, amount: 0 }`. Позиція `planned` (DOM-24) має `planned.quantity = position.quantity`. Приклад (`position.test.ts`): куплено 2 шт за 1 980 01.01.2025 і заплановано 1 шт за 990 на 01.05.2026 — на 15.03.2026 `planned = { quantity: 1, amount: 990 }` (позиція при цьому `inCirculation`, бо не всі купівлі заплановані), на 01.05.2026 (купівля сьогоднішня, уже зроблена) — `{ quantity: 0, amount: 0 }`. З цього гаманець, картка ОВДП і вибір ОВДП пишуть, скільки ОВДП позиції ще лише заплановано (див. [screens/wallet-and-bond.md](screens/wallet-and-bond.md), WAL-05). `position.ts`, `plannedPart`.

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

Приклад (`position.test.ts`): ОВДП 10 %, номінал 1000, купони по 50 щопівроку з 2025-07-01 до 2027-01-01, погашення 1000 у 2027-01-01. Дві ОВДП куплено 2025-01-01 за 1980, сьогодні 2026-03-15: `invested` 1980, `coupons` 400, `redemption` 2000, `received` 200, `expected` 2200, `totalPayments` 2400, `netIncome` 420, `returnPercent` 21,21.

**DOM-30.** «Річна дохідність» позиції (`positionYield`): `null`, якщо погашення не опубліковано або вкладена сума недодатна. Інакше для кожної купівлі окремо рахується `annualYield(amount, purchaseDate, виплати лише цієї купівлі за DOM-21)`. Купівля з `null` (ціна, якій не відповідає жодна дохідність у межах −99…1000 %, найімовірніше помилка в сумі) у середню не входить і рахується в `purchasesWithoutYield`, тож не ховає дохідність решти. Результат — `round2(Σ (дохідність × amount) / Σ amount)` за купівлями з дохідністю; ця сума — `annualYieldBasis`. Без жодної такої купівлі — `null`. Заплановані купівлі входять. Приклад: купівля 1 шт за 1 000 ₴ і помилкова за 1 ₴ — дохідність позиції як у першої, `purchasesWithoutYield = 1`, `annualYieldBasis = 1000`. `position.ts`, `positionYield`.

### Підсумки за валютою (resultsByCurrency)

**DOM-31.** `resultsByCurrency(positions)` іде валютами в порядку `CURRENCIES` і дає підсумок кожної валюти, що має хоч одну позицію, також коли жодної з них немає в даних НБУ. Позиція без даних НБУ додає до `invested` те, що коштувала, і рахується у `withoutDataCount`; її виплат не знає ніхто, тож у виплатах, чистому доході й дохідності її немає. Приклад: гривневі позиції по 1 000 ₴ з даними і 500 ₴ без них → `invested` 2 500, `withoutDataCount` 1, виплати й чистий дохід — лише за першими. `position.ts`, `resultsByCurrency`.

**DOM-32.** `invested` — `round2` суми `investedAmount` **усіх** позицій валюти. `coupons`, `redemption`, `received`, `expected`, `totalPayments` — `round2` сум відповідних полів позицій з даними НБУ. `complete` — чи відомі всі виплати: кожна позиція є в даних НБУ й має опубліковане погашення. `incompleteCount` — скільки позицій з даними НБУ без опублікованого погашення; `withoutDataCount` — скільки позицій без даних НБУ. `resultsByCurrency`.

**DOM-33.** `netIncome` і `returnPercent` валюти рахуються лише за позиціями з опублікованим погашенням: `netIncome = round2(round2(Σ totalPayments опублікованих) − round2(Σ invested опублікованих))`, `returnPercent` — від `invested` лише опублікованих. Якщо опублікованих немає — обидва `null`. Тож поруч стоять `invested` усіх позицій і `netIncome` лише частини з них. Приклад (`position.test.ts`): позиція 1000 → 1200 і позиція без погашення за 1000: `invested` 2000, `netIncome` 200, `returnPercent` 20, `incompleteCount` 1. `resultsByCurrency`. `published = { invested, totalPayments }` — ці дві суми опублікованих позицій, з яких рахується `netIncome`; коли всі позиції опубліковані, вони збігаються з `invested` і `totalPayments` валюти. `netIncomeBasis(results)` — текст «Виплати <published.totalPayments> мінус вкладено <published.invested>, лише ОВДП з опублікованим погашенням» для підказки під «Чистим доходом»; дохідність окремо пояснює вкладену суму, яку використано як базу. Повертає `undefined`, коли `incompleteCount = 0`: тоді суми над ним сходяться і так.

**DOM-34.** `annualYield` валюти — середня «Річна дохідність» позицій, у яких вона є (не `null`), зважена на `annualYieldBasis` (суму купівель, за якими її пораховано, DOM-30), з `round2`; `null`, якщо таких позицій немає. Позиції з `null`-дохідністю враховуються в `withoutYieldCount`; кількість показується біля середньої дохідності. `resultsByCurrency`.

### Гаманець (Wallet)

**DOM-35.** `buildWallet(purchases, byIsin, today)` будує всі поля з купівель: `positions` = `groupPositions(purchases)` → `walletPosition` (DOM-25); `payments` — виплати всіх позицій, відсортовані лише за датою (у межах дати зберігається порядок позицій, а в позиції — порядок графіка ОВДП); `purchaseEvents` — кожна купівля як подія (DOM-36); а також `purchases`, `byIsin`, `today`. Виплат ОВДП, яких немає в даних НБУ, немає. `wallet.ts`, `buildWallet`.

**DOM-36.** Подія купівлі (`purchaseEvents`): `type: 'purchase'`, `id`, `date = purchaseDate`, `isin`, `currency` (DOM-15), `quantity`, `total = amount` (без округлення), `isTopUp` — `true` для кожної купівлі позиції, крім найранішої (у разі однакових дат — крім першої в масиві). Події сортуються за датою; входять і купівлі ОВДП, яких немає в даних НБУ. `portfolio.ts`, `purchaseEvents`.

**DOM-37.** Порядок подій розкладу (`compareScheduleEvents`): за датою, а в один день виплата перед купівлею. `portfolio.ts`.

**DOM-38.** _Вилучено._ Гаманця, звуженого до валюти й ОВДП, більше немає: події фільтрів виплат відбирає сам `filterSchedule` (PAY-02).

**DOM-39.** `walletScopeOptions(wallet)`: `isins` — ISIN усіх позицій, зокрема без даних НБУ, відсортовані за абеткою; `currencyOf` — валюта кожного з цих ISIN (валюта позиції, DOM-15); `currencies` — валюти з `CURRENCIES`, що трапляються серед виплат або подій купівлі гаманця (фактично — валюти всіх купівель, бо кожна купівля дає подію). `wallet.ts`, `walletScopeOptions`.

**DOM-40.** _Вилучено._ Збережені фільтри виплат підганяє до гаманця `effectiveFilters` (PFLT-02).

**DOM-61.** ОВДП валюти (`isinsIn(options, currency)`): ISIN з `options.isins`, у яких `currencyOf` дорівнює `currency`, у тому самому порядку; за `currency = null` — усі `options.isins`. З цього списку фільтри виплат показують розділ «ОВДП» (лише ОВДП обраної валюти). `wallet.ts`, `isinsIn`.

**DOM-41.** `useWallet()` = `buildWallet(купівлі активного плану, byIsin з useBonds, today)` плюс `plan`, `bonds` (увесь каталог або `null`) і `refresh`. `useToday` читає календарну дату зі спільного сховища налаштувань. Дата оновлюється під час запуску та повернення застосунку на передній план; окремого таймера опівночі немає. Сесії зазвичай тривають до 15 хвилин, тому для оновлення дати після опівночі достатньо знову відкрити застосунок. `src/hooks/useWallet.hook.ts`.

**DOM-42.** Вибір ОВДП для купівлі (`bondChoices(bonds, query, today)`): запит очищається від пробілів і переводиться у великі літери. Без запиту — лише ОВДП, які можна купити сьогодні (DOM-9). Із запитом — усі ОВДП, чий ISIN містить запит, також погашені. Спершу ті, що можна купити, далі — за `maturityDate`. `portfolio.ts`, `bondChoices`.

### Річна дохідність і ціна для дохідності

**DOM-43.** `annualYield(amount, purchaseDate, payments)` — ставка `r` (частка на рік, виплачувана двома половинами), за якої дисконтовані виплати дорівнюють сумі купівлі:

`amount = Σ total_i / (1 + r/2)^(h_i)`, де `h_i = daysBetween(purchaseDate, date_i) / 365 × 2` (півроки).

Пошук — бісекцією на `[−0,99; 10,00]` (тобто −99…1000 %, `ANNUAL_YIELD_RANGE`), 100 кроків, результат `round2(r × 100)` у відсотках. `src/lib/portfolio/yield.ts`, `annualYield`.

**DOM-44.** `annualYield` дає `null`, якщо `amount <= 0`, виплат немає, вартість виплат за −99 % менша за `amount` (дохідність нижча за −99 %) або вартість за 1000 % більша за `amount` (дохідність вища за 1000 %). `annualYield`.

**DOM-45.** `amountForYield(date, payments, yieldPercent)` = `round2(Σ total_i / (1 + yieldPercent/100/2)^(h_i))` з тим самим відліком півроків від `date`: сума, за якої купівля (або утримання) дає цю дохідність. Обернена до DOM-43: `annualYield(amountForYield(d, p, 15), d, p) ≈ 15`. Купівля за номіналом у день купона ОВДП зі ставкою 16 % при `yieldPercent = 16` дає ≈ 1000 (у межах ±5 через рахунок за 365 днів). `yield.ts`, `amountForYield`; `market.test.ts`.

**DOM-46.** `MAX_PLAUSIBLE_YIELD = 40` (%): дохідність вище за це вважається радше помилкою в сумі чи кількості. Сама модель її не застосовує; її використовують форма купівлі (`assessPurchase`, «Перевірте суму») і екран продажу (`holdOrSell`). `market.ts`.

### Нові ОВДП

**DOM-47.** `newBondsRate(bond, date, bonds)` шукає «нові ОВДП» для порівняння: інші ОВДП (`isin` відрізняється) тієї самої валюти, з `issueDate > addMonthsISO(date, −12)` і `issueDate <= date`, які ще можна купити на `date` (DOM-9), і з тим самим `maturityTerm` на `date`, що й `bond`. Якщо їх менше за `MIN_NEW_BONDS = 2` — `null`. Інакше `{ rate: median(їхніх rate), count, term }`. `NEW_BOND_MONTHS = 12`. `market.ts`, `newBondsRate`.

**DOM-48.** `median`: для непарної кількості — середній елемент як є; для парної — `round2` середнього двох середніх. `market.ts`, `median`.

**DOM-49.** Нові ОВДП словами (`newBondsLabel`): «<count> ОВДП у <код валюти> зі строком <до 1 року | 1–3 роки | понад 3 роки>, розміщених за останні 12 місяців», напр. «12 ОВДП у UAH зі строком 1–3 роки, розміщених за останні 12 місяців». `market.ts`.

### Підказки (hints)

**DOM-50.** Підказка — `Hint { tone, text }`, `tone` ∈ `success | info | warning | error`. Вага: `info` 0, `success` 1, `warning` 2, `error` 3. `sortHints` прибирає `null` і сортує від найсерйознішої (сортування стабільне — рівні зберігають порядок). `worstTone` — найсерйозніший тон, `info` для порожнього списку. `Verdict { tone: success | warning | error, title }` — підсумок над підказками. `src/lib/portfolio/hints.ts`.

**DOM-51.** Порівняння з обліковою ставкою (`keyRateHint(annualYield, keyRate, currency, errorGap?)`): `null`, якщо валюта не `UAH` або ставки немає. `gap = round2(keyRate − annualYield)`. Якщо `gap > 1` (`WARNING_GAP`): тон `error`, коли задано `errorGap` і `gap > errorGap`, інакше `warning`; текст «Річна дохідність X% на G п.п. нижча за облікову ставку НБУ (K%): депозит чи нова ОВДП можуть дати більше.» Якщо `gap < 0`: `success`, «Річна дохідність X% вища за облікову ставку НБУ (K%).» Якщо `0 <= gap <= 1`: `success`, «Річна дохідність X% близька до облікової ставки НБУ (K%).» `src/lib/portfolio/yieldHints.ts`.

Приклад: дохідність 14, ставка 15,5 → `gap` 1,5 → `warning`; з `errorGap = 3` (форма купівлі) дохідність 12 → `gap` 3,5 → `error`. Екран продажу передає `keyRateHint` без `errorGap`, тож там `error` не буває.

**DOM-52.** Порівняння з новими ОВДП (`newBondsHint(annualYield, newBonds, currency)`): `null` без нових ОВДП. `gap = round2(newBonds.rate − annualYield)`. `gap > 1` → `warning`: «Річна дохідність X% на G п.п. нижча за медіанну ставку купону (R%) <newBondsLabel>: нова ОВДП може дати більше.» `gap < 0` → `success`, «… вища за медіанну ставку купону (R%) <label>.»; `0 <= gap <= 1` → `success`, «… близька до медіанної ставки купону (R%) <label>.» Тону `error` тут немає; валюта не обмежена. `yieldHints.ts`.

**DOM-53.** Відсотки показуються з десятковою комою й знаком «−»: «14,5%», «−3,2%». На екрані — компонент `Percent` (`src/components/typography/`; `null` → «—»), у текстах (підказки, підзаголовки, підписи для читачів екрана) — `formatPercent`; процентні пункти («G п.п.») — `formatRateNumber`. `src/utils/format.ts`, `yieldHints.ts`.

### Округлення, формат і лічильники

**DOM-54.** `round2(value)` округлює до копійок «від нуля»: спершу `|value| × 100` зводиться до 15 значущих цифр (щоб 1.005 → 1.01), потім `Math.round`; від'ємний знак повертається, лише якщо копійок не нуль (без «−0,00»). `src/utils/number.ts`.

**DOM-55.** Округлення виконується на кожному рівні: виплата позиції (`total`), суми за типом (`sumTotals`), `investedAmount`, `totalPayments`, `netIncome`, `returnPercent`, підсумки валюти; `annualYield` і `median` (парний) — теж до сотих. Сума `amount` купівлі і `total` події купівлі не округлюються. `portfolio.ts`, `position.ts`.

**DOM-56.** Гроші форматуються `uk-UA` з рівно двома знаками після коми: `formatMoney(10200.5, 'UAH')` → «10 200,50 ₴»; знаки валют ₴, $, €, для іншої валюти — її код. `formatTotals` додає суми по валютах окремо: «10 200,00 ₴ + 5 000,00 $». На екрані суму показує компонент `Money` (`src/components/typography/`; `null` → «—»), у текстах (підказки, підписи для читачів екрана) — `formatMoney`. `src/utils/format.ts`.

**DOM-57.** Українська множина (`plural`): `n % 10 = 1` і `n % 100 ≠ 11` → форма «один»; `n % 10` у 2–4 і `n % 100` не в 12–14 → «кілька»; інакше → «багато». `purchaseCount(5)` → «5 купівель», `planCount(2)` → «2 плани». `format.ts`, `counts.ts`.

**DOM-58.** `parseAmount(text)` прибирає пробіли (і нерозривні), замінює **першу** кому на крапку й повертає `Number(...)`; порожній рядок → `NaN`. `format.ts`.

## Стани

- **Немає ОВДП у даних НБУ** (каталог ще не завантажено або ISIN там відсутній): позиція `unknown`, без виплат, `results` і дохідності; її купівлі все одно є серед `purchaseEvents` і рахуються у валюті `purchase.currency`; `resultsByCurrency` її пропускає.
- **Погашення ще не опубліковано**: `complete: false`, `netIncome`/`returnPercent`/`annualYield` — `null`; виплати-купони й суми `coupons`, `received`, `expected` рахуються.
- **Порожній план**: `buildWallet([])` дає порожні масиви; `resultsByCurrency` — порожній список.

## Крайні випадки

1. **Купівля в день купона / погашення.** Виплата цього дня не належить купівлі (DOM-21). Купівлю в день погашення форма не дозволяє (DOM-9), але якщо вона є (з резервної копії), позиція не має виплат: `coupons = redemption = 0`, і за опублікованого погашення `netIncome = −invested`, а `annualYield` — `null`.
2. **День погашення.** ОВДП ще `inCirculation`, погашення ще не `isPaid` (DOM-8, DOM-22); з наступного дня — `redeemed` і `isPaid`.
3. **Часткові погашення.** `redemption` — сума всіх часткових погашень. Докупівля в день часткового погашення не отримує його і рахується від уже зменшеного залишку.
4. **Купівля, датована сьогодні**, — зроблена, не запланована (DOM-12); виплата, датована сьогодні, — не отримана (DOM-22).
5. **Нульова кількість або сума.** `pricePerBond`, `positionYield` і `returnPercent` повертають `null` замість ділення на нуль; форма й відновлення копії відхиляють такі купівлі.
6. **Інші валюти.** `keyRateHint` для не-`UAH` — `null`; `newBondsRate` бере ОВДП лише тієї самої валюти. ОВДП не в UAH/USD/EUR до застосунку не потрапляють.
7. **Валюта купівлі не збігається з валютою ОВДП.** Виграє валюта ОВДП з даних НБУ (DOM-15); `purchase.currency` лишається лише як запасна.
8. **Дублікати ISIN у каталозі НБУ.** `byIsin` — `Map`, тож останній рядок перезаписує попередні; список `bonds` містить обидва.
9. **Позиція з однією купівлею без дохідності** (поза діапазоном −99…1000 %): дохідність позиції рахується за рештою купівель, а пропущені купівлі видно на картці ОВДП (DOM-30, BND-15); у середній валюти позиція важить лише суму купівель з дохідністю (DOM-34).
10. **Без планів** `useActivePlan()` — `undefined`, гаманець порожній; екрани до цього не доходять (див. охоронці в `spec/backup-settings-onboarding.md`).
11. **Опівночі.** Якщо застосунок залишається відкритим, дата у сховищі не змінюється від самого рендеру; `isPaid`, стан і «заплановано» оновляться після наступного відкриття або повернення на передній план (DOM-41).
12. **Високосний рік.** Півроки рахуються як `дні / 365 × 2` (DOM-43), тож 366-денний рік дає трохи більше двох півроків.

## Покриття тестами

- `src/lib/portfolio/portfolio.test.ts`: DOM-08, DOM-09, DOM-10, DOM-36 (`isTopUp`, зокрема однакові дати й переставлений вхідний масив), DOM-42 і вибір наступної виплати.
- `yield.test.ts`: відсутні виплати, обидві межі дохідності та скінченна від’ємна дохідність (DOM-43/44).
- `hints.test.ts`: порядок і найсерйозніший тон підказок (DOM-50).
- `src/utils/number.test.ts`: округлення до копійок і відсутність від’ємного нуля (DOM-54).
- `src/lib/portfolio/market.test.ts`: DOM-11, DOM-45, DOM-47 (з DOM-48 для парної кількості — неявно, медіана двох значень), DOM-49.
- `src/lib/portfolio/position.test.ts`: DOM-21 (купон у день купівлі), DOM-24, DOM-25 (без даних НБУ), DOM-60 («tells what of the Position is still only planned»), DOM-26, DOM-27, DOM-30, DOM-31, DOM-32, DOM-33, DOM-34.
- `src/lib/portfolio/wallet.test.ts`: DOM-20 (порядок позицій), DOM-35, DOM-36 (порядок подій, купівля без даних НБУ).
- `src/lib/payment-filters/filterSchedule.test.ts`: DOM-37, DOM-39 (опосередковано), DOM-61 і DOM-40 для ISIN іншої валюти (через `effectiveFilters`, «keeps only the bonds of the currency shown…»).
- `src/lib/portfolio/portfolio.test.ts`: DOM-59 (`plannedQuantity` виплат до і після запланованої купівлі).
- `src/lib/add-purchase/purchaseHints.test.ts`: DOM-51, DOM-52, DOM-46 (опосередковано, через `assessPurchase`).
- `src/screens/holdings/holdOrSell.test.ts`: DOM-45, DOM-51/DOM-52 без `errorGap` (опосередковано).
- `src/lib/portfolio/yieldHints.test.ts`: DOM-51, DOM-52 напряму (пороги 1 п.п. і `errorGap`, тексти, валюта, відсутня ставка чи нові ОВДП).
- `src/api/nbu/nbuBonds.test.ts`: DOM-02, DOM-03, DOM-04.
- `src/utils/date.test.ts`: DOM-13 (`daysBetween`, зокрема через перехід на літній час) і календарні дати.
- `src/utils/format.test.ts`: DOM-53 (`formatPercent`), DOM-56 (`formatMoney`, `formatTotals`), DOM-57 (`plural`), DOM-58 (`parseAmount`).

**Без тестів:** DOM-05 (ОЗДП разом з ОВДП — питання, а не правило коду), DOM-06 окремо, DOM-12 окремо, DOM-15, DOM-16, DOM-19, DOM-22 (межа «сьогодні»), DOM-23, DOM-41 (хук).

## Прогалини й питання

**GAP-DOM-01. ОЗДП змішані з ОВДП.** Каталог залишає `XS…` ОЗДП з номіналом 1 разом із внутрішніми ОВДП (DOM-05). Вони з'являються у виборі ОВДП і, головне, входять до `newBondsRate` для USD/EUR, де медіана ставок може змішати два різні ринки. Варто з'ясувати, чи це задумано і чи `GLOSSARY.md` («номінал зазвичай 1 000») це передбачає. Доказ: `src/api/nbu/nbuBonds.ts`, `fetchBonds`; `market.ts`, `newBondsRate`. Серйозність: середня.

**DOM-62.** Купівлі одного ISIN з однаковою датою впорядковуються за id, тому ознака докупівлі не залежить від порядку збереження. `parseAmount` приймає десяткові кому й крапку та однозначні формати `1,000.50` і `1.000,50`; некоректне `1,000,50` відхиляється.

**DOM-63.** Коли облікову ставку не вдалося завантажити (`useKeyRate(...).failed`, DATA-17), гривнева оцінка каже про це підказкою тону `info` (`keyRateFailedHint`): «Не вдалося завантажити облікову ставку НБУ, тож порівняння з нею немає. Спробуйте пізніше.» Тон `info`, бо ставка, що не завантажилась, нічого не каже про купівлю, тож вердикт не змінюється. Для USD і EUR, де ставку не порівнюють, і поки ставка лише завантажується — нічого. `yieldHints.ts`, `keyRateFailedHint`.
