import { type GoalMonth } from '@/features/coupon-goal';

import { type CouponGoal } from '@/entities/portfolio';

import { MONTHS, MONTHS_SHORT, formatMoney, round2 } from '@/shared/lib';
import { Card, ColumnChart, LegendRow, Separator, Typography } from '@/shared/ui';

const MONTH_COLUMNS = MONTHS.map((name, month) => ({ label: MONTHS_SHORT[month], name }));

type Props = {
  goal: CouponGoal;
  months: GoalMonth[];
};

/** The goal's year month by month: the plan's coupons together with those the goal adds. */
export function GoalMonthsCard({ goal, months }: Props) {
  const { currency, year, monthly } = goal;
  const planTotal = round2(months.reduce((sum, month) => sum + month.plan, 0));
  const addedTotal = round2(months.reduce((sum, month) => sum + month.added, 0));

  return (
    <Card
      title={`Купони ${year}`}
      footer={`Ціль — ${formatMoney(monthly, currency)} у кожному місяці.`}
    >
      <ColumnChart
        columns={MONTH_COLUMNS}
        series={[
          {
            label: 'купони',
            color: 'coupon',
            values: months.map((month) => round2(month.plan + month.added)),
          },
        ]}
        currency={currency}
      />
      <Separator variant="card" />
      <LegendRow
        color="coupon"
        label="Купони за рік"
        value={formatMoney(round2(planTotal + addedTotal), currency)}
      />
      <Typography variant="caption1" tone="secondary">
        З них купони плану — {formatMoney(planTotal, currency)}, купівель під ціль —{' '}
        {formatMoney(addedTotal, currency)}.
      </Typography>
    </Card>
  );
}
