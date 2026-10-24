# ОВДП Портфель

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
The day the bond pays its Redemption and stops existing. The Bond is still In circulation that day, but no Purchase can be dated on or after it, as that day's Payments go to the previous owner.

**Coupon rate** (Ставка купону):
The bond's annual interest on its Nominal, paid in coupons.

**Key rate** (Облікова ставка НБУ):
The NBU policy rate in effect on a given date; the benchmark a purchase is compared with. It is the hryvnia's rate, so only hryvnia Bonds are compared with it.

**Redeemed** (погашено, погашені):
A Bond whose Maturity date is behind today, even while the NBU has not published its Redemption.
_Avoid_: inactive, closed

**In circulation** (в обігу):
A Bond not yet Redeemed.
_Avoid_: active

## Payments

**Payment** (Виплата):
Money a bond pays its holder on a scheduled date: either a Coupon or the Redemption.
_Avoid_: calling a Purchase itself a payment

**Payment schedule** (Виплати):
The Active plan's Payments in date order, with its Purchases listed among them as money going out.
_Avoid_: Графік, calendar

**Upcoming** (Майбутні):
The Payments not yet Received and the Planned purchases, in date order.

**Event type** (Події):
Coupon, Redemption or Purchase, as a filter of the Payment schedule; Purchases can be left out like either kind of Payment.
_Avoid_: Тип виплати

**Coupon** (Купон):
A periodic interest Payment.

**Redemption** (Погашення):
A Payment returning the Nominal: all of it on the Maturity date, or in parts, the last on the Maturity date.
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

**Purchase** (Купівля):
Buying a quantity of one Bond on one date for a total amount paid; the price per bond follows from them.
_Avoid_: покупка, investment, holding, transaction

**Planned purchase** (Запланована купівля, заплановано):
A Purchase dated after today. Once its date arrives it counts as made, with no confirmation.
_Avoid_: pending, unconfirmed

**Top-up** (Докупівля):
A Purchase of a Bond the Plan already holds from an earlier Purchase.

**Position**:
All Purchases of one Bond within one Plan, taken together. It is planned while every Purchase in it is a Planned purchase; otherwise its Bond is In circulation or Redeemed.
_Avoid_: holding

**Wallet** (Гаманець, у гаманці; Портфель):
The Positions of the Active plan, whether that Plan is real or hypothetical. It is not a separate record of what the user really owns. Reports and the app's name call it Портфель when they look at it as a whole.
_Avoid_: holdings, Портфель for a Plan, Wallet for a Plan that isn't active

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
_Avoid_: Дохідність alone, Дохідність за строк

**Annual yield** (Річна дохідність):
The yearly rate at which a Purchase's payments, discounted to its date, equal what was paid for it; comparable with the Coupon rate and the Key rate. For a Position or more Purchases, their yields averaged by what was paid.
_Avoid_: Дохідність alone, return, rate

## Reports

**Report** (Звіт):
A summary of the Wallet meant to be read whole, as it would be on paper: everything shows at once, and its filters only choose what it covers.

**Balance** (Сальдо року, Сальдо періоду):
The Payments of a year or period minus the Purchases made in it.
_Avoid_: cash flow, result

**Income** (Дохід за рік, Дохід за період):
The Coupons of a year or period plus what its Redemptions brought over what the bonds they repay cost.
_Avoid_: Чистий дохід, which is over the whole term
