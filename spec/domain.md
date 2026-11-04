# Доменна модель

**Що це й навіщо.** Тут описано, з чого складається облік у застосунку і як він рахує гроші: ОВДП з даних НБУ та їхні збережені знімки, операції (купівлі й продажі), плани, позиції, гаманець, виплати, результати («Вкладено», «Усього надходжень», «Чистий дохід», «Дохідність за весь строк»), «Річна дохідність», «Дохід» за проміжок часу, порівняння з обліковою ставкою НБУ та новими ОВДП, правила дат і округлення. Кожне правило описує те, що код робить сьогодні, щоб його можна було звірити з кодом і тестом. Терміни — з `GLOSSARY.md`.

## Звідки дані

- `src/lib/portfolio/portfolio.ts` — типи `Bond`, `BondPayment`, `Operation`, `PlanOperation`, `Position`, `PositionPayment`, `OperationEvent`, `ScheduleEvent`; `CURRENCIES`, `CURRENCY_NAMES`, `currencyTitle`, `bondChoices`, `groupPositions`, `plannedByDate`, `awaitsConfirmation`, `receivedAmount`, `isReceived`, `isRedeemed`, `canBuyOn`, `maturesWithin`, `pricePerBond`, `purchaseCurrency`, `positionCurrency`, `positionPayments`, `operationEvents`, `compareScheduleEvents`, `sumTotals`, `nextPayment`.
- `src/lib/portfolio/operations.ts` — `compareOperations`, `signedQuantity`, `quantityOn`, `operationHistoryError`, `purchaseLots` (FIFO), `mergeBond`, `operationBonds`, `refreshOperationBonds`.
- `src/lib/portfolio/migrateOperations.ts` — `LegacyPurchase`, `migratePurchases`, `withPlannedFlags`.
- `src/lib/portfolio/position.ts` — `PositionState`, `PositionResults`, `CurrencyResults`, `WalletPosition`, `hasRedemption`, `walletPosition`, `plannedPart`, `resultsByCurrency`, `netIncomeBasis` (усередині: `netIncomeOf`, `positionResults`, `positionYield`, `positionState`).
- `src/lib/portfolio/wallet.ts` — `Wallet`, `buildWallet`, `WalletScopeOptions`, `walletScopeOptions`, `isinsIn`.
- `src/lib/portfolio/yield.ts` — `annualYield`, `amountForYield`, `ANNUAL_YIELD_RANGE`.
- `src/lib/portfolio/market.ts` — `maturityTerm`, `NEW_BOND_MONTHS`, `MAX_PLAUSIBLE_YIELD`, `newBondsRate`, `newBondsLabel` (усередині: `MIN_NEW_BONDS`, `median`).
- `src/lib/portfolio/hints.ts`, `src/lib/portfolio/yieldHints.ts` — `Hint`, `Verdict`, `sortHints`, `worstTone`, `keyRateHint`, `newBondsHint`, `keyRateFailedHint`.
- `src/lib/portfolio/plan.ts` — `InvestmentPlan`, `DEFAULT_PLAN_NAME`, `PLAN_NAME_MAX_LENGTH`, `samePlanName`, `uniquePlanName`; `src/lib/portfolio/counts.ts` — `planCount`, `operationCount`.
- `src/hooks/useWallet.hook.ts` — `useWallet`; `src/stores/plans/` — `useActivePlan`, `getActivePlan`, `useActiveOperations`, `getActiveOperations`, `restorePortfolio`; `src/stores/operations/` — збереження операцій (`syncOperationBonds`, `recoverOperationBonds`; усередині: `updateOperations`) і міграція `holdings-v1`; `src/stores/bonds/` — `saveBonds`.
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

**DOM-12.** Дата лише визначає, якою операція зберігається (`plannedByDate(date, today)` = `date > today`): з датою після сьогодні — запланованою, з сьогоднішньою чи раніше — зробленою. Далі запланованість — ознака самої операції (DOM-72), а не порівняння дат: настання дати її не знімає. Те саме правило дає форма для чернетки (назва секції «Запланована купівля», оцінка на сьогодні) і міграції (DOM-71). Стосується і купівель, і продажів. `portfolio.ts`, `plannedByDate`.

**DOM-13.** `daysBetween(from, to)` — різниця календарних днів (`differenceInCalendarDays`), тож перехід на літній час день не зсуває. `date.ts`.

### Купівля і план

**DOM-14.** `Operation` має `id`, `type: purchase | sale`, `isin`, `date`, `amount`, `quantity`, `currency`, `planned: boolean` (DOM-72), `ovdp: Bond | null`. Сума і кількість додатні; `amount` — повна витрачена сума з комісіями або отримана сума після комісій. `PlanOperation` додає `planId`. `ovdp` — знімок ОВДП з усіма умовами й графіком виплат (DOM-69); `null` допустимий лише для старих купівель, умови яких не вдалося відновити (DOM-71), і ніколи — для продажу. `portfolio.ts`, тип `Operation`; `src/lib/backup/contents.schema.ts`.

**DOM-15.** Валюта операції зберігається під час її створення та не змінюється через каталог НБУ (`purchaseCurrency` повертає `operation.currency`, `mergeBond` зберігає валюту знімка). Валюта позиції (`positionCurrency`) — валюта її першої операції. Резервна копія перевіряє, що валюта операції збігається з валютою її `ovdp` і що всі операції одного ISIN мають одну валюту. `portfolio.ts`, `purchaseCurrency`, `positionCurrency`; `src/lib/backup/contents.schema.ts`, `validateContents`.

**DOM-16.** «Ціна 1 шт» = `round2(amount / quantity)` (`pricePerBond`). За недодатної кількості повертається `null`. `portfolio.ts`, `pricePerBond`.

**DOM-72.** Операція запланована (`planned: true`), доки користувач не підтвердив, що вона відбулась, хоч би якою була її дата. Збереження форми купівлі чи продажу ставить `planned = plannedByDate(date, today)` (DOM-12): нова операція з датою після сьогодні — запланована; збереження з датою, що вже настала, — це і є підтвердження; зміна підтвердженої операції на майбутню дату знову робить її запланованою. Запланована операція, дата якої настала, чекає підтвердження (`awaitsConfirmation(op, today)` = `op.planned && op.date <= today`): форма питає, відбулась вона чи ні (BUY-40, SALE-20). Поки операцію не підтверджено, вона не дає «отримано»: частка виплати, що припадає на ОВДП запланованих купівель, не отримана (`receivedAmount(payment)` = `amount × (quantity − plannedQuantity)` для виплати з `isPaid`, інакше 0), виплата отримана повністю (`isReceived`) лише з `isPaid` і `plannedQuantity = 0`, а сума запланованого продажу — в «Очікується» (DOM-26). Виплати, кількість позиції, «Вкладено» й перевірка історії (DOM-67) рахують заплановані операції так само, як зроблені: план — один сценарій. Приклад: купівлю заплановано на 02.01.2026 і не підтверджено; 01.08.2026 купон 01.07.2026 за її ОВДП ще не отримано, і рядок купівлі каже «Чекає підтвердження — торкніться». `portfolio.ts`, `plannedByDate`, `awaitsConfirmation`, `receivedAmount`, `isReceived`; `src/hooks/useAddPurchaseForm.hook.ts`; `src/screens/holdings/useSaleForm.hook.ts`.

**DOM-17.** План — `InvestmentPlan { id, name, isActive }`. Назва плану — до `PLAN_NAME_MAX_LENGTH = 80` символів; запропонована назва першого плану — «Мій план» (`DEFAULT_PLAN_NAME`). `src/lib/portfolio/plan.ts`.

**DOM-18.** План містить усі операції з його `planId`. `useActiveOperations` зі `stores/plans` надає операції активного плану для побудови гаманця.

**DOM-65.** Назви планів не повторюються без урахування регістру й пробілів на краях (`samePlanName`: `trim` і `toLocaleLowerCase('uk-UA')`); форма назви відхиляє таку назву повідомленням «План із такою назвою вже існує». `uniquePlanName(name, plans)` обрізає назву до `PLAN_NAME_MAX_LENGTH` і, якщо вона вже є, додає « (2)», « (3)»… так, щоб разом вийшло не більше 80 символів. Так названо запропонований новий план («План N») і копію плану («… (копія)»). `plan.ts`, `samePlanName`, `uniquePlanName`; `src/screens/plan/PlanNameScreen.tsx`; `src/stores/plans/actions.ts`, `duplicateInvestmentPlan`.

### Позиція і право на виплати

**DOM-20.** Позиція (`groupPositions`) об’єднує всі операції ISIN; позиції йдуть у порядку, в якому кожен ISIN уперше трапився серед операцій. `quantity` = Σ кількостей купівель − Σ кількостей продажів (`signedQuantity`) за **всіма** операціями: сюди входять і заплановані купівлі, і заплановані продажі (DOM-72). `investedAmount` = `round2` суми `amount` тільки купівель. Операції позиції впорядковано `compareOperations`: за датою, у той самий день купівлі перед продажами, далі за `id`. Після повного продажу позиція та її історія залишаються. `portfolio.ts`, `groupPositions`; `operations.ts`, `compareOperations`, `signedQuantity`.

**DOM-66.** Залишок на дату (`quantityOn(operations, date)`) — купівлі мінус продажі з датою **не пізніше** `date`; ним екран продажу показує «Доступно на дату», а «Тримати чи продати» — скільки ОВДП є сьогодні. Він відрізняється від права на виплату (DOM-21), де операція того самого дня не враховується. `operations.ts`, `quantityOn`; `src/screens/holdings/useSaleForm.hook.ts`, `holdOrSell.ts`.

**DOM-67.** Історія операцій не може продати більше, ніж є (`operationHistoryError`): операції всіх планів упорядковуються `compareOperations` (DOM-20), і для кожної пари «план + ISIN» залишок після кожної операції має бути не від’ємним. Інакше повертається текст «Продаж <ISIN> від <ДД.ММ.РРРР> перевищує кількість ОВДП у плані на цю дату.» Купівлі одного дня йдуть перед продажами, тож продати можна й у день купівлі. Заплановані операції перевіряються так само, як зроблені (DOM-72): запланований продаж теж не може перевищити кількість, а запланована купівля, на яку він спирається, рахується. Перевірка стоїть на кожному записі сховища операцій (додати, змінити, видалити операцію чи позицію, видалити чи скопіювати план) — помилка не змінює дані; у формі продажу (SALE-05; чернетка продажу має `planned` за своєю датою) і у відновленні резервної копії (`validateContents`). Тож вилучення чи перенесення купівлі, без якої продаж став би завеликим, теж відхиляється. `operations.ts`, `operationHistoryError`; `src/stores/operations/actions.ts`, `updateOperations`; `src/screens/holdings/saleForm.schema.ts`; `src/lib/backup/contents.schema.ts`.

**DOM-21.** Право на виплату визначається залишком до дати виплати: купівлі мінус продажі зі строго меншою датою. Купон у день продажу залишається продавцю; купівля того дня його не отримує. Продажі розподіляються за FIFO; виплати після продажу не нараховуються на продану кількість.

Формула для кожної виплати (до розрахунку беруться лише операції з датою < дата виплати): `quantity = Σ quantity купівель − Σ quantity продажів`; виплата з `quantity = 0` до позиції не потрапляє; `plannedQuantity` = залишок (після FIFO) тих купівель, що ще заплановані (`planned`, DOM-72); `total = round2(amount × quantity)`; `isPaid = payment.date < today`. `portfolio.ts`, `positionPayments`; `operations.ts`, `purchaseLots`.

Приклад: купівля 2026-01-01, купон теж 2026-01-01 — купон у виплати позиції не потрапляє; перший купон — 2026-07-01. Приклад із продажем (`operations.test.ts`): куплено 10 шт 2025-02-01, продано 4 шт 2025-07-01, у день купона — купон 2025-07-01 нараховано на 10 шт (500), наступний купон і погашення — на 6 шт (300 і 6 000).

**DOM-68.** FIFO (`purchaseLots`) розподіляє кожен продаж між купівлями позиції від найранішої, не змінюючи записаних операцій: кожна купівля стає «лотом» із залишком і своєю часткою продажів `{ date, quantity, total }`, де `total = amount продажу × quantity частки / quantity продажу` (без округлення). Операції перед цим упорядковуються `compareOperations` (DOM-20). Лоти дають право на виплати (DOM-21) і потоки річної дохідності кожної купівлі (DOM-64). Приклад (`operations.test.ts`): купівлі 10 шт 2025-02-01 і 10 шт 2025-03-01, продаж 15 шт 2025-07-01 — з першої купівлі продано 10, з другої 5; купон 2025-07-01 — на 20 шт, далі — на 5. `operations.ts`, `purchaseLots`.

**DOM-59.** `plannedQuantity` виплати (`PositionPayment`) — скільки з її `quantity` припадає на купівлі, яких ще не підтверджено: купівлі, датовані раніше за виплату (DOM-21), з `planned` (DOM-72). Виплата з `isPaid` теж може мати `plannedQuantity > 0`, якщо купівля, дата якої настала, ще чекає підтвердження: тоді отримано лише частку за підтвердженими купівлями (`receivedAmount`), а рядок пише «чекає підтвердження». Приклад від 2026-10-31: куплено 2 шт 2026-03-01 і заплановано 3 шт на 2026-12-01; купон 2027-01-15 має `quantity = 5`, `plannedQuantity = 3`; купон 2026-11-15 — `quantity = 2`, `plannedQuantity = 0`. З цього рядки виплат пишуть «заплановано» (див. `ScheduleEventRow` у [screens/payments.md](screens/payments.md)). `portfolio.ts`, `positionPayments`.

**DOM-22.** Дата виплати минула (`isPaid`), коли вона строго раніше за сьогодні; виплата, датована сьогодні, ще очікується. «Отримано» виплата лише тоді, коли ще й жодна її ОВДП не з купівлі, що чекає підтвердження (`isReceived`, DOM-72). `positionPayments`, `isReceived`.

**DOM-23.** Наступна виплата позиції (`nextPayment`) — перша неотримана виплата в порядку графіка ОВДП; якщо купон і погашення в один день, це купон (DOM-03). `portfolio.ts`, `nextPayment`.

**DOM-24.** Стани позиції (`positionState`), у такому порядку перевірок: немає ні збереженого знімка, ні ОВДП у каталозі (DOM-35) — `unknown`; `position.quantity = 0` (DOM-20) — `sold`, рядок гаманця пише «продано»; усі операції заплановані (`planned`, DOM-72; дата значення не має) — `planned`; ОВДП погашена (DOM-08) — `redeemed` («погашено»); інакше — `inCirculation`. Оскільки `quantity` віднімає й заплановані продажі, позиція, весь залишок якої заплановано продати, уже `sold`. `position.ts`, `positionState`; `src/screens/holdings/PositionRow.tsx`.

**DOM-25.** `walletPosition(position, bond, today)` дає `WalletPosition`: `position`, `bond` (немає, якщо ОВДП нема ні в збережених знімках, ні в каталозі НБУ, DOM-35), `currency` (DOM-15), `payments` (DOM-21; порожні без ОВДП), `nextPayment`, `state` (DOM-24), `results` (немає без ОВДП), `annualYield`, `annualYieldBasis`, `purchasesWithoutYield` (DOM-30; `null`, 0, 0 без ОВДП), `planned` (DOM-60; є й без ОВДП). `position.ts`, `walletPosition`.

**DOM-60.** Запланована частина позиції (`WalletPosition.planned`, `plannedPart(position)`, без `today`): `{ quantity, amount }` — сума кількостей і `round2` суми `amount` купівель позиції з `planned` (DOM-72); заплановані продажі сюди не входять; коли всі купівлі підтверджені — `{ quantity: 0, amount: 0 }`. Позиція `planned` (DOM-24) лише з купівель має `planned.quantity = position.quantity`. Приклад (`position.test.ts`): куплено 2 шт за 1 980 01.01.2025 і заплановано 1 шт за 990 на 01.05.2026 — на 15.03.2026 `planned = { quantity: 1, amount: 990 }` (позиція при цьому `inCirculation`, бо не всі купівлі заплановані), на 01.05.2026 — так само, бо настання дати нічого не змінює; після підтвердження — `{ quantity: 0, amount: 0 }`. З цього гаманець, картка ОВДП і вибір ОВДП пишуть, скільки ОВДП позиції ще лише заплановано (див. [screens/wallet-and-bond.md](screens/wallet-and-bond.md), WAL-05). `position.ts`, `plannedPart`.

### Результати позиції (PositionResults)

**DOM-26.** Поля `PositionResults` позиції з даними ОВДП — знімком або каталогом (`positionResults`):

- `invested` = `position.investedAmount` (усі купівлі, разом із запланованими).
- `coupons` = `round2(Σ total виплат-купонів)` (DOM-21).
- `redemption` = `round2(Σ total виплат-погашень)`.
- `saleProceeds` = `round2(Σ amount продажів)` (повні суми після комісій, DOM-14).
- `received` = `round2(Σ receivedAmount виплат + Σ amount підтверджених продажів)` (DOM-72): частка виплати за ОВДП купівлі, що чекає підтвердження, не отримана, хоч дата й минула; підтверджений продаж отримано, хоч би яка його дата, на відміну від виплати (DOM-22).
- `expected` = `round2(totalPayments − received)`: виплати попереду, неотримані частки минулих виплат і заплановані продажі.
- `totalPayments` = `round2(coupons + redemption + saleProceeds)` — «Усього надходжень».
- `complete` = `position.quantity === 0 || hasRedemption(bond)` (DOM-06): повністю проданій позиції опубліковане погашення не потрібне, бо виплат після продажу в неї немає.

`position.ts`, `positionResults`, `sumTotals`.

**DOM-27.** `netIncome` = `round2(totalPayments − invested)`, якщо `complete`, інакше `null`. `returnPercent` = `round2(netIncome / invested × 100)`, якщо `netIncome` не `null` і `invested` не нуль, інакше `null`. `position.ts`, `netIncomeOf`.

Приклад (`position.test.ts`): ОВДП 10 %, номінал 1000, купони по 50 щопівроку з 2025-07-01 до 2027-01-01, погашення 1000 у 2027-01-01. Дві ОВДП куплено 2025-01-01 за 1980, сьогодні 2026-03-15: `invested` 1980, `coupons` 400, `redemption` 2000, `saleProceeds` 0, `received` 200, `expected` 2200, `totalPayments` 2400, `netIncome` 420, `returnPercent` 21,21. Приклад повного продажу (`operations.test.ts`): 10 шт куплено за 10 000, продано всі 2025-07-01 за 10 500, НБУ опублікував лише купон 2025-07-01 (500, він ще належить продавцю): позиція `sold`, `complete: true`, `netIncome` = 500 + 10 500 − 10 000 = 1 000.

**DOM-30.** «Річна дохідність» позиції (`positionYield`): `null` (з `annualYieldBasis = 0`, `purchasesWithoutYield = 0`), якщо в позиції ще є ОВДП (`quantity > 0`), а погашення не опубліковано (DOM-06); повністю проданій позиції погашення не потрібне. Інакше для кожної купівлі окремо рахується `annualYield(amount, date, потоки цієї купівлі)` — потоки описує DOM-64. Купівля з `null` (ціна, якій не відповідає жодна дохідність у межах −99…1000 %, найімовірніше помилка в сумі, або інший випадок DOM-44, зокрема недодатна сума) у середню не входить і рахується в `purchasesWithoutYield`, тож не ховає дохідність решти. Результат — `round2(Σ (дохідність × amount) / Σ amount)` за купівлями з дохідністю; `annualYieldBasis = round2(Σ amount)` цих купівель. Без жодної такої купівлі — `null`. Заплановані купівлі входять. Приклад: купівля 1 шт за 1 000 ₴ і помилкова за 1 ₴ — дохідність позиції як у першої, `purchasesWithoutYield = 1`, `annualYieldBasis = 1000`. `position.ts`, `positionYield`.

**DOM-64.** Потоки річної дохідності купівлі: кожна виплата ОВДП з датою, пізнішою за дату купівлі, помножена на залишок цієї купівлі на дату виплати — `quantity` купівлі мінус її частки продажів (FIFO, DOM-68) з датою < дата виплати (без `round2`; виплати з нульовою сумою відкидаються), — плюс частки продажів цієї купівлі як надходження в дати продажів. Тож продана частина заробляє до продажу й повертає свою частку суми продажу, а дохідності зважуються на суми купівель, як у DOM-30. Усі потоки в день купівлі не дають визначеної річної дохідності (`null`, DOM-44). `position.ts`, `positionYield`; `operations.ts`, `purchaseLots`.

### Підсумки за валютою (resultsByCurrency)

**DOM-31.** `resultsByCurrency(positions)` іде валютами в порядку `CURRENCIES` і дає підсумок кожної валюти, що має хоч одну позицію, також коли жодної з них немає в даних НБУ. Позиція без даних НБУ додає до `invested` те, що коштувала, і рахується у `withoutDataCount`; її виплат не знає ніхто, тож у виплатах, чистому доході й дохідності її немає. Приклад: гривневі позиції по 1 000 ₴ з даними і 500 ₴ без них → `invested` 2 500, `withoutDataCount` 1, виплати й чистий дохід — лише за першими. `position.ts`, `resultsByCurrency`.

**DOM-32.** `invested` — `round2` суми `investedAmount` **усіх** позицій валюти. `coupons`, `redemption`, `saleProceeds`, `received`, `expected`, `totalPayments` — `round2` сум відповідних полів позицій з даними ОВДП. `complete` — чи відомі всі надходження: кожна позиція має дані ОВДП і `complete` (DOM-26: опубліковане погашення або повністю продана). `incompleteCount` — скільки позицій з даними ОВДП мають `complete: false` (ще не продані повністю й без опублікованого погашення); `withoutDataCount` — скільки позицій без даних ОВДП. `resultsByCurrency`.

**DOM-33.** `netIncome` і `returnPercent` валюти рахуються лише за позиціями з `complete` (опубліковане погашення або повністю продані, DOM-26), далі — «опубліковані»: `netIncome = round2(round2(Σ totalPayments опублікованих) − round2(Σ invested опублікованих))`, `returnPercent` — від `invested` лише опублікованих. Якщо опублікованих немає — обидва `null`. Тож поруч стоять `invested` усіх позицій і `netIncome` лише частини з них. Приклад (`position.test.ts`): позиція 1000 → 1200 і позиція без погашення за 1000: `invested` 2000, `netIncome` 200, `returnPercent` 20, `incompleteCount` 1. `resultsByCurrency`. `published = { invested, totalPayments }` — ці дві суми опублікованих позицій, з яких рахується `netIncome`; коли всі позиції опубліковані, вони збігаються з `invested` і `totalPayments` валюти. `netIncomeBasis(results)` — текст «Виплати <published.totalPayments> мінус вкладено <published.invested>, лише повністю продані ОВДП або ОВДП з опублікованим погашенням» для підказки під «Чистим доходом» на вкладці плану (`src/screens/plan/PlanScreen.tsx`); «Дохідність за весь строк» там окремо пояснює вкладену суму, яку використано як базу. Повертає `undefined`, коли `incompleteCount = 0`: тоді суми над ним сходяться і так, а підказка — «Виплати мінус вкладення — ваш заробіток». `position.ts`, `netIncomeBasis`.

**DOM-34.** `annualYield` валюти — середня «Річна дохідність» позицій, у яких вона є (не `null`), зважена на `annualYieldBasis` (суму купівель, за якими її пораховано, DOM-30), з `round2`; `null`, якщо таких позицій немає. Позиції з `null`-дохідністю враховуються в `withoutYieldCount`; кількість показується біля середньої дохідності. `resultsByCurrency`.

### Гаманець (Wallet)

**DOM-35.** `buildWallet(operations, catalog, today)` будує всі поля з операцій. Спершу `byIsin = operationBonds(operations, catalog, today)` (DOM-69): збережені знімки `ovdp` операцій мають перевагу, каталог НБУ заповнює лише ISIN без знімка. Далі `positions` = `groupPositions(operations)` → `walletPosition` (DOM-25); `payments` — виплати всіх позицій, відсортовані лише за датою (у межах дати зберігається порядок позицій, а в позиції — порядок графіка виплат ОВДП); `operationEvents` — кожна купівля й кожен продаж як подія (DOM-36); а також `operations`, `byIsin` (уже зі знімками) і `today`. Виплат ОВДП, яких немає ні серед знімків, ні в каталозі, немає. `wallet.ts`, `buildWallet`.

**DOM-36.** Подія операції (`operationEvents`): `type` (`'purchase'` або `'sale'`), `id`, `date`, `isin`, `currency` (DOM-15), `quantity`, `total = amount` (без округлення), `planned` (DOM-72), `isTopUp` — `true` для купівлі, перед якою в позиції (у порядку `compareOperations`, DOM-20) вже є інша купівля; для найранішої купівлі й для продажів — `false`. Купівлі одного дня впорядковуються за `id` (DOM-62). Події сортуються лише за датою (стабільно, тож у межах дня зберігається порядок позицій і операцій); входять і операції ОВДП, яких немає в даних. Рядок розкладу починається з «Купівля», «Докупівля» чи «Продаж» (`ScheduleEventRow`). `portfolio.ts`, `operationEvents`; `src/components/portfolio/ScheduleEventRow.tsx`.

**DOM-62.** Купівлі одного ISIN з однаковою датою впорядковуються за `id` (`compareOperations`), тому ознака докупівлі не залежить від порядку збереження. Приклад (`portfolio.test.ts`): купівлі `a` і `b` того самого дня — докупівля `b`, хоч би в якому порядку вони лежали в масиві. `operations.ts`, `compareOperations`.

**DOM-37.** Порядок подій розкладу (`compareScheduleEvents`): за датою, а в один день виплата перед купівлею чи продажем; купівля й продаж одного дня між собою рівні (зберігається вхідний порядок). `portfolio.ts`, `compareScheduleEvents`.

**DOM-38.** _Вилучено._ Гаманця, звуженого до валюти й ОВДП, більше немає: події фільтрів виплат відбирає сам `filterSchedule` (PAY-02).

**DOM-39.** `walletScopeOptions(wallet)`: `isins` — ISIN усіх позицій, зокрема без даних НБУ, відсортовані за абеткою; `currencyOf` — валюта кожного з цих ISIN (валюта позиції, DOM-15); `currencies` — валюти з `CURRENCIES`, що трапляються серед виплат або подій операцій гаманця (фактично — валюти всіх операцій, бо кожна операція дає подію). `wallet.ts`, `walletScopeOptions`.

**DOM-40.** _Вилучено._ Збережені фільтри виплат підганяє до гаманця `effectiveFilters` (PFLT-02).

**DOM-61.** ОВДП валюти (`isinsIn(options, currency)`): ISIN з `options.isins`, у яких `currencyOf` дорівнює `currency`, у тому самому порядку; за `currency = null` — усі `options.isins`. З цього списку фільтри виплат показують розділ «ОВДП» (лише ОВДП обраної валюти). `wallet.ts`, `isinsIn`.

**DOM-41.** `useWallet()` будує гаманець (`buildWallet`, DOM-35) з операцій активного плану (`useActiveOperations`), каталогу `useBonds().byIsin` і `useToday()`. Вкладені `ovdp` мають пріоритет; каталог дає ОВДП для нового вибору й для старих записів без знімка. Гаманець, картка ОВДП, виплати й підсумок плану доступні без каталогу, якщо хоч одна операція плану має знімок: лише тоді `WalletGate` не чекає на дані НБУ. `src/hooks/useWallet.hook.ts`; `src/components/portfolio/WalletGate.tsx`.

**DOM-69.** Знімок ОВДП в операціях (`mergeBond(saved, fetched, today)`) зливається з новою відповіддю НБУ так: без збереженого знімка береться новий; інакше умови (`nominal`, `rate`, дати, `description`) беруться з нової відповіді, а `isin` і `currency` — зі збереженого знімка. Виплати ключуються як «дата:тип»: рядок, якого в знімку ще немає, додається; наявний рядок замінюється лише з датою не раніше за сьогодні; рядки, яких у відповіді немає, залишаються. Тож минулі суми не змінюються, майбутні виправляються, а історія не зникає, навіть коли НБУ прибрав ОВДП. Результат сортується, як у DOM-03. `operationBonds` зливає знімки всіх операцій одного ISIN в один і кладе їх поверх каталогу; `refreshOperationBonds(operations, bonds, today)` зливає ще й `bonds` і дає **кожній** операції цього ISIN, у всіх планах, той самий знімок (операції ISIN без знімка й без ОВДП у `bonds` лишаються з `ovdp: null`). `operations.ts`, `mergeBond`, `operationBonds`, `refreshOperationBonds`.

**DOM-70.** Коли знімки оновлюються: кожен запис сховища операцій вирівнює знімки (`refreshOperationBonds(…, [], todayISO())` в `updateOperations`, після перевірки DOM-67); кожна нова відповідь каталогу (`saveBonds`) спершу відновлює з попереднього збереженого каталогу знімки ISIN, яких ще немає в жодній операції (`recoverOperationBonds`), потім зливає з операціями нову відповідь (`syncOperationBonds`) і лише тоді замінює каталог. Відновлення резервної копії перевіряє й вирівнює знімки (`validateContents`), записує операції як є (`replaceOperations`) і відновлює з кешованого каталогу лише ISIN без знімка (`restorePortfolio`), тож старіший кеш не перезаписує знімки з копії. `src/stores/operations/actions.ts`; `src/stores/bonds/actions.ts`, `saveBonds`; `src/stores/plans/actions.ts`, `restorePortfolio`; `src/lib/backup/contents.schema.ts`, `validateContents`.

**DOM-71.** Старі купівлі (`LegacyPurchase`: поля операції без `type`, `ovdp` і `planned`, дата в `purchaseDate`) стають операціями `migratePurchases(purchases, bonds, today)`: `date = purchaseDate`, `type: 'purchase'`, `planned = plannedByDate(purchaseDate, today)` (DOM-12), `ovdp` — ОВДП того самого ISIN зі списку `bonds` або `null`, якщо її там немає (умови не вигадуються, купівля не відкидається). Операції без ознаки `planned` (збережені до підтвердження, DOM-72) отримують її через `withPlannedFlags(operations, today)`: `planned = op.planned === true || date > today` — минулі лишаються зробленими, як і рахувалися, позначена запланованою лишається такою, а датована наперед не може бути зробленою, хоч би що в ній було. Сховище `holdings-v1` (persist `version: 2`) з версії 0 мігрує збережені `purchases` (`migratePurchases` з кешованим каталогом НБУ), з версії 1 — операції без ознаки (`withPlannedFlags`); резервна копія v6 (`legacyContentsSchema`) — `migratePurchases` з порожнім списком і `todayISO()`, тож її купівлі отримують `ovdp: null`, доки знімок не відновиться (DOM-70); копія v7 без ознаки — `withPlannedFlags` у `validateContents`. Операція з `ovdp: null` не може бути продажем: копія з таким продажем відхиляється. `migrateOperations.ts`, `migratePurchases`, `withPlannedFlags`; `src/stores/operations/store.ts`; `src/lib/backup/contents.schema.ts`.

**DOM-42.** Вибір ОВДП для купівлі (`bondChoices(bonds, query, today)`): запит очищається від пробілів і переводиться у великі літери. Без запиту — лише ОВДП, які можна купити сьогодні (DOM-09). Із запитом — усі ОВДП, також погашені, у яких: ISIN містить запит; або дата погашення у вигляді «ДД.ММ.РРРР» (`formatDate`) чи `YYYY-MM-DD` містить запит; або запит — ставка зі знаком «%» (`16,5%` чи `16.5%`), що дорівнює `rate`. Спершу ті, що можна купити, далі — за `maturityDate`. Приклад (`portfolio.test.ts`): «01.06.2026» знаходить ОВДП з погашенням 2026-06-01, «16,5%» — ОВДП зі ставкою 16,5. `portfolio.ts`, `bondChoices`.

### Річна дохідність і ціна для дохідності

**DOM-43.** `annualYield(amount, date, payments)` — ставка `r` (частка на рік, виплачувана двома половинами), за якої дисконтовані виплати дорівнюють сумі купівлі:

`amount = Σ total_i / (1 + r/2)^(h_i)`, де `h_i = daysBetween(date, date_i) / 365 × 2` (півроки).

Пошук — бісекцією на `[−0,99; 10,00]` (тобто −99…1000 %, `ANNUAL_YIELD_RANGE`), 100 кроків, результат `round2(r × 100)` у відсотках. `src/lib/portfolio/yield.ts`, `annualYield`.

**DOM-44.** `annualYield` дає `null`, якщо `amount <= 0`, виплат немає, усі виплати припадають на сам день `date` (нуль півроків — ставка нічого не змінює), вартість виплат за −99 % менша за `amount` (дохідність нижча за −99 %) або вартість за 1000 % більша за `amount` (дохідність вища за 1000 %). `annualYield`.

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

**DOM-63.** Коли облікову ставку не вдалося завантажити (`useKeyRate(...).failed`, DATA-17), гривнева оцінка каже про це підказкою тону `info` (`keyRateFailedHint`): «Не вдалося завантажити облікову ставку НБУ, тож порівняння з нею немає. Спробуйте пізніше.» Тон `info`, бо ставка, що не завантажилась, нічого не каже про купівлю, тож вердикт не змінюється. Для USD і EUR, де ставку не порівнюють, і поки ставка лише завантажується — нічого. `yieldHints.ts`, `keyRateFailedHint`.

**DOM-53.** Відсотки показуються з десятковою комою й знаком «−»: «14,5%», «−3,2%». На екрані — компонент `Percent` (`src/components/typography/`; `null` → «—»), у текстах (підказки, підзаголовки, підписи для читачів екрана) — `formatPercent`; процентні пункти («G п.п.») — `formatRateNumber`. `src/utils/format.ts`, `yieldHints.ts`.

### Округлення, формат і лічильники

**DOM-54.** `round2(value)` округлює до копійок «від нуля»: спершу `|value| × 100` зводиться до 15 значущих цифр (щоб 1.005 → 1.01), потім `Math.round`; від'ємний знак повертається, лише якщо копійок не нуль (без «−0,00»). `src/utils/number.ts`.

**DOM-55.** Округлення виконується на кожному рівні: виплата позиції (`total`), суми за типом (`sumTotals`), `investedAmount`, `totalPayments`, `netIncome`, `returnPercent`, підсумки валюти; `annualYield` і `median` (парний) — теж до сотих. `saleProceeds`, `received` і `expected` позиції теж округлюються (DOM-26). Сума `amount` операції, `total` події операції (DOM-36), частки продажів за FIFO (DOM-68) і потоки річної дохідності (DOM-64) не округлюються. `portfolio.ts`, `position.ts`, `operations.ts`.

**DOM-56.** Гроші форматуються `uk-UA` з рівно двома знаками після коми: `formatMoney(10200.5, 'UAH')` → «10 200,50 ₴»; знаки валют ₴, $, €, для іншої валюти — її код. `formatTotals` додає суми по валютах окремо: «10 200,00 ₴ + 5 000,00 $». На екрані суму показує компонент `Money` (`src/components/typography/`; `null` → «—»), у текстах (підказки, підписи для читачів екрана) — `formatMoney`. `src/utils/format.ts`.

**DOM-57.** Українська множина (`plural`): `n % 10 = 1` і `n % 100 ≠ 11` → форма «один»; `n % 10` у 2–4 і `n % 100` не в 12–14 → «кілька»; інакше → «багато». `planCount(2)` → «2 плани», `operationCount(5)` → «5 операцій» (купівлі й продажі разом: налаштування, «Мої плани», підтвердження відновлення копії). `format.ts`, `counts.ts`.

**DOM-58.** `parseAmount(text)` прибирає всі пробільні символи (і нерозривні); порожній рядок → `NaN`. Приймає однозначні формати з розрядами `1,000.50` (коми — розряди) і `1.000,50` (крапки — розряди) та просте число з однією десятковою комою чи крапкою (`1000,5`, `1000.5`, `,5`) і знаком `+`/`-`; решта (`1,000,50`, `1.2.3`) → `NaN`. Зворотне — `amountInputText(amount)`: число з десятковою комою для поля вводу («1000,5»). `format.ts`, `parseAmount`, `amountInputText`.

## Стани

- **Немає даних ОВДП** (жодна операція ISIN не має знімка, а каталог ще не завантажено або ISIN там відсутній): позиція `unknown`, без виплат, `results` і дохідності; її операції все одно є серед `operationEvents` і рахуються у валюті `operation.currency`; `resultsByCurrency` додає лише її `invested` (DOM-31).
- **Погашення ще не опубліковано** (а в позиції ще є ОВДП): `complete: false`, `netIncome`/`returnPercent`/`annualYield` — `null`; виплати-купони й суми `coupons`, `saleProceeds`, `received`, `expected` рахуються.
- **Усе продано**: позиція `sold` (DOM-24), `complete: true` навіть без опублікованого погашення, є `netIncome`, `returnPercent` і, якщо потоки дозволяють, `annualYield` (DOM-26, DOM-30); історія операцій і отримані виплати залишаються.
- **Порожній план**: `buildWallet([])` дає порожні масиви; `resultsByCurrency` — порожній список.

## Крайні випадки

1. **Купівля в день купона / погашення.** Виплата цього дня не належить купівлі (DOM-21). Купівлю в день погашення не дозволяє ні форма (DOM-09), ні резервна копія для операції зі знімком (`date < ovdp.maturityDate`, `contents.schema.ts`); її можна мати лише як стару купівлю з `ovdp: null`, умови якої потім відновлено з каталогу (DOM-71). Тоді позиція не має виплат: `coupons = redemption = 0`, і за опублікованого погашення `netIncome = −invested`, а `annualYield` — `null`.
2. **День погашення.** ОВДП ще `inCirculation`, погашення ще не `isPaid` (DOM-8, DOM-22); з наступного дня — `redeemed` і `isPaid`.
3. **Часткові погашення.** `redemption` — сума всіх часткових погашень. Докупівля в день часткового погашення не отримує його і рахується від уже зменшеного залишку.
4. **Операція, збережена з датою сьогодні**, — зроблена, не запланована (DOM-12); запланована раніше, дата якої сьогодні настала, — чекає підтвердження (DOM-72); виплата, датована сьогодні, — не отримана (DOM-22).
5. **Нульова кількість або сума.** `pricePerBond`, `positionYield` і `returnPercent` повертають `null` замість ділення на нуль; форма й відновлення копії відхиляють такі купівлі.
6. **Інші валюти.** `keyRateHint` для не-`UAH` — `null`; `newBondsRate` бере ОВДП лише тієї самої валюти. ОВДП не в UAH/USD/EUR до застосунку не потрапляють.
7. **Валюта операції не збігається з валютою ОВДП.** Виграє валюта операції: `purchaseCurrency` завжди повертає `operation.currency`, а `mergeBond` зберігає валюту знімка (DOM-15, DOM-69). Резервна копія таке розходження відхиляє (знімок і операція мають одну валюту, а операції одного ISIN — одну валюту).
8. **Дублікати ISIN у каталозі НБУ.** `byIsin` у `useBonds` — `Map`, тож останній рядок перезаписує попередні; список `bonds` містить обидва. Для ISIN зі збереженим знімком гаманець бере знімок (DOM-35).
9. **Позиція з однією купівлею без дохідності** (поза діапазоном −99…1000 %): дохідність позиції рахується за рештою купівель, а пропущені купівлі видно на картці ОВДП (DOM-30, BND-15); у середній валюти позиція важить лише суму купівель з дохідністю (DOM-34).
10. **Без планів** `useActivePlan()` — `undefined`, гаманець порожній; екрани до цього не доходять (див. охоронці в `spec/backup-settings-onboarding.md`).
11. **Опівночі.** Якщо застосунок залишається відкритим, дата у сховищі не змінюється від самого рендеру; `isPaid`, «отримано» і «чекає підтвердження» оновляться після наступного відкриття або повернення на передній план (DOM-07).
12. **Високосний рік.** Півроки рахуються як `дні / 365 × 2` (DOM-43), тож 366-денний рік дає трохи більше двох півроків.
13. **Продаж у день виплати.** Виплата цього дня ще належить продавцю (DOM-21), а продаж у день купівлі дозволено, бо купівлі одного дня йдуть перед продажами (DOM-67). Продаж, збережений з датою сьогодні, — підтверджений, тож уже входить у `received` (DOM-26).
14. **Майбутній продаж з резервної копії.** Закрито: форма продажу тепер теж дозволяє майбутню дату (SALE-04), а такий продаж, із копії чи з форми, — просто запланований (DOM-72; копія без ознаки — `withPlannedFlags`, DOM-71). Він одразу зменшує `quantity` позиції (DOM-20, тож повний продаж наперед дає `sold`, DOM-24), але право на виплати до його дати зберігається (DOM-21), а його сума — в `expected`, доки його не підтверджено (DOM-26).

## Покриття тестами

- `src/lib/portfolio/portfolio.test.ts`: DOM-08, DOM-09, DOM-10, DOM-16 (нульова кількість), DOM-36 і DOM-62 (`isTopUp`, однакові дати й переставлений вхідний масив), DOM-42 (ISIN, дата погашення, ставка з «%»), DOM-59 і DOM-72 (`plannedQuantity` виплат до і після запланованої купівлі — за ознакою `planned`), DOM-22 і DOM-23 (виплата, датована сьогодні, — ще не отримана й саме вона наступна).
- `src/lib/portfolio/operations.test.ts`: DOM-20 і DOM-21 з продажами (частковий продаж у день купона, `quantity` після продажів), DOM-24 (`sold`), DOM-26/DOM-27 з продажами (`saleProceeds`, `received`, `complete` і `netIncome` повністю проданої позиції без опублікованого погашення), DOM-30/DOM-64 (дохідність проданої позиції не `null`), DOM-36 (події купівлі й продажу), DOM-67 (перепродаж: продаж без купівлі, купівля, перенесена після продажу, завеликий продаж, продаж в іншому плані), DOM-68 (FIFO: кількості виплат 20, 5, 5), DOM-69 (знімок не зникає, коли НБУ прибрав ОВДП чи її минулі рядки; минулі суми зберігаються, майбутні виправляються; усі операції ISIN у всіх планах мають один знімок), DOM-71 (міграція з каталогом і без нього, `planned` за датою на `today`; `withPlannedFlags`: без ознаки — за датою, ознака `true` лишається, датована наперед не буває зробленою).
- `yield.test.ts`: відсутні сума чи виплати, обидві межі дохідності та скінченна від’ємна дохідність (DOM-43/44).
- `hints.test.ts`: порядок і найсерйозніший тон підказок (DOM-50).
- `src/utils/number.test.ts`: округлення до копійок і відсутність від’ємного нуля (DOM-54).
- `src/lib/portfolio/market.test.ts`: DOM-11, DOM-45, DOM-47 (з DOM-48 для парної кількості — неявно, медіана двох значень), DOM-49.
- `src/lib/portfolio/position.test.ts`: DOM-21 (купон у день купівлі), DOM-24 (`planned`, також після дати, доки не підтверджено; `inCirculation`, `redeemed`, `unknown`; `sold` — в `operations.test.ts`), DOM-25 (без даних НБУ), DOM-60 («tells what of the Position is still only planned, until it is confirmed»), DOM-72 і DOM-26 (купон за ОВДП непідтвердженої купівлі не отримано: `received` 300 проти 350 після підтвердження, `totalPayments` однаковий), DOM-26, DOM-27, DOM-30, DOM-31, DOM-32, DOM-33 (разом із текстом `netIncomeBasis`), DOM-34.
- `src/lib/portfolio/wallet.test.ts`: DOM-20 (порядок позицій), DOM-35, DOM-36 (порядок подій, купівля без даних НБУ).
- `src/lib/payment-filters/filterSchedule.test.ts`: DOM-37, DOM-39 (опосередковано), DOM-61 і DOM-40 для ISIN іншої валюти (через `effectiveFilters`, «keeps only the bonds of the currency shown…»).
- `src/lib/add-purchase/purchaseHints.test.ts`: DOM-51, DOM-52, DOM-46 (опосередковано, через `assessPurchase`).
- `src/screens/holdings/holdOrSell.test.ts`: DOM-45, DOM-51/DOM-52 без `errorGap` (опосередковано).
- `src/lib/portfolio/yieldHints.test.ts`: DOM-51, DOM-52 напряму (пороги 1 п.п. і `errorGap`, тексти, валюта, відсутня ставка чи нові ОВДП).
- `src/api/nbu/nbuBonds.test.ts`: DOM-02, DOM-03, DOM-04.
- `src/utils/date.test.ts`: DOM-13 (`daysBetween`, зокрема через перехід на літній час) і календарні дати.
- `src/utils/format.test.ts`: DOM-53 (`formatPercent`), DOM-56 (`formatMoney`, `formatTotals`), DOM-57 (`plural`), DOM-58 (`parseAmount`, однозначні формати з розрядами й відхилені неоднозначні).
- `src/stores/appSettings/appSettings.test.ts`: DOM-07 (`refreshToday`).
- `src/stores/plans/plans.test.ts`: DOM-18 (операції активного плану), DOM-65 (`samePlanName`, `uniquePlanName`, назви копій «План (копія)», «План (копія) (2)»).
- `src/lib/backup/contents.schema.test.ts`: DOM-71 для копії v7 без ознаки `planned` (`withPlannedFlags` у `validateContents`).
- `src/screens/holdings/purchaseScreenTitle.test.ts`, `saleScreenTitle.test.ts`: `awaitsConfirmation` (DOM-72) опосередковано.
- `src/stores/operations/operations.test.ts`: DOM-67 на рівні сховища (вилучення чи перенесення купівлі, без якої продаж став би завеликим, відхиляється, дані не змінюються).

**Без тестів:** DOM-05 (ОЗДП разом з ОВДП — питання, а не правило коду), DOM-06 окремо, DOM-12 окремо (`plannedByDate`; збереження форм з ним — хуки), DOM-72 (`receivedAmount`, `isReceived` окремо; збереження з `planned` — хуки), DOM-15, DOM-41 (хук), DOM-44 (усі потоки в день купівлі), DOM-66 (`quantityOn` окремо; опосередковано — у `holdOrSell.test.ts`), DOM-70 (коли оновлюються знімки: дії сховищ), `amountInputText` (DOM-58).

## Прогалини й питання

**GAP-DOM-01. ОЗДП змішані з ОВДП.** Каталог залишає `XS…` ОЗДП з номіналом 1 разом із внутрішніми ОВДП (DOM-05). Вони з'являються у виборі ОВДП і, головне, входять до `newBondsRate` для USD/EUR, де медіана ставок може змішати два різні ринки. Варто з'ясувати, чи це задумано і чи `GLOSSARY.md` («номінал зазвичай 1 000») це передбачає. Доказ: `src/api/nbu/nbuBonds.ts`, `fetchBonds`; `market.ts`, `newBondsRate`. Серйозність: середня.
