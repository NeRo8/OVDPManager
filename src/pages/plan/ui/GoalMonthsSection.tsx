import { type GoalMonth, goalYearMonths } from '@/features/coupon-goal';

import { type CouponGoal } from '@/entities/portfolio';

import { formatMoney, round2 } from '@/shared/lib';
import { InfoRow, Section } from '@/shared/ui';

import { monthsPhrase } from './goalTexts';

type Props = {
  goal: CouponGoal;
  /** «Роки купонів», month by month */
  months: GoalMonth[];
  /** Months no bond for sale pays a coupon in, as indexes of `months` */
  shortMonths: number[];
};

/**
 * Each of «Роки купонів»: how many of its months reach the goal, and where its coupons come from
 * or which months no bond pays in.
 */
export function GoalMonthsSection({ goal, months, shortMonths }: Props) {
  const { currency, monthly } = goal;
  const years = Array.from({ length: goal.incomeYears }, (_, index) => goal.year + index);
  const row = (year: number) => {
    const own = goalYearMonths(months, goal, year);
    const reached = own.filter((month) => round2(month.plan + month.added) >= monthly).length;
    const short = shortMonths
      .filter((index) => goal.year + Math.floor(index / 12) === year)
      .map((index) => index % 12);
    const plan = round2(own.reduce((sum, month) => sum + month.plan, 0));
    const added = round2(own.reduce((sum, month) => sum + month.added, 0));
    const hint = short.length
      ? `У ${monthsPhrase(short)} жодна ОВДП у продажу не платить купон`
      : `Купони плану ${formatMoney(plan, currency)} + купівлі під ціль ${formatMoney(added, currency)}`;
    return (
      <InfoRow key={year} label={String(year)} hint={hint} value={`${reached} з 12 місяців`} />
    );
  };

  return (
    <Section
      title="Місяців з ціллю"
      footer={
        shortMonths.length
          ? 'Місяці, у які жодна ОВДП у продажу не платить купон, до цілі не дотягують.'
          : undefined
      }
    >
      {years.map(row)}
    </Section>
  );
}
