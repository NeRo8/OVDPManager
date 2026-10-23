# OVDP Manager

Tracking Ukrainian government bonds (ОВДП): what was bought or is planned to be bought, and what those bonds pay back. Each term gives the Ukrainian word the app shows for it.

## Bonds

**Bond** (ОВДП):
One issue of Ukrainian government bonds, identified by its ISIN, with the terms and payment schedule the NBU publishes.
_Avoid_: облігація, security, paper

**Nominal** (Номінал):
The face value of one bond.
_Avoid_: Номінал for the total returned at maturity (that is the Redemption)

**Issue date** (Дата розміщення):
The day the bond is first placed; no purchase can be dated before it.

**Maturity date** (Дата погашення):
The day the bond pays its Redemption and stops existing; no purchase can be dated after it.

**Coupon rate** (Ставка купону):
The bond's annual interest on its Nominal, paid in coupons.

**Key rate** (Облікова ставка НБУ):
The NBU policy rate in effect on a given date; the benchmark a purchase is compared with.

## Payments

**Payment** (Виплата):
Money a bond pays its holder on a scheduled date: either a Coupon or the Redemption.
_Avoid_: calling a Purchase itself a payment

**Payment schedule** (Виплати):
The Active plan's Payments in date order, with its Purchases listed among them as money going out.
_Avoid_: Графік, calendar

**Coupon** (Купон):
A periodic interest Payment.

**Redemption** (Погашення):
The final Payment, returning the Nominal on the Maturity date.
_Avoid_: Номінал, maturity payment

**Received** (отримано):
A Payment whose date is already behind today.
_Avoid_: виплачено

## Plans and purchases

**Plan** (План):
A named set of Purchases the user keeps together, real or hypothetical; every Purchase belongs to exactly one Plan.
_Avoid_: portfolio, scenario

**Active plan**:
The one Plan the app is currently showing.

**Purchase** (Покупка):
Buying a quantity of one Bond on one date for a total amount paid; the price per bond follows from them.
_Avoid_: investment, holding, transaction

**Planned purchase** (Запланована покупка, заплановано):
A Purchase dated after today. Once its date arrives it counts as made, with no confirmation.
_Avoid_: pending, unconfirmed

**Top-up** (Докупівля):
A Purchase of a Bond the Plan already holds from an earlier Purchase.

**Position**:
All Purchases of one Bond within one Plan, taken together.
_Avoid_: holding

**Wallet** (Гаманець, у гаманці):
The Positions of the Active plan, whether that Plan is real or hypothetical. It is not a separate record of what the user really owns.
_Avoid_: portfolio, holdings, Wallet for a Plan that isn't active

## Results

**Invested** (Вкладено):
The total amount paid for Purchases.
_Avoid_: Інвестовано, cost

**Total payments** (Усього виплат):
Coupons plus Redemption a Plan or Purchase is entitled to, received or still ahead.
_Avoid_: proceeds

**Net income** (Чистий дохід):
Total payments minus Invested.
_Avoid_: Чистий результат, profit

**Return over the term** (Дохідність за весь строк):
Net income as a percentage of Invested, for the whole time to maturity rather than per year.

**Annual yield** (Річна дохідність):
The yearly rate at which a Purchase's payments, discounted to its date, equal what was paid for it; comparable with the Coupon rate and the Key rate.
_Avoid_: return, rate
