import { type GoalMonth } from '@/features/coupon-goal';

import { type CouponGoal } from '@/entities/portfolio';

import { MONTHS, formatMoney, round2 } from '@/shared/lib';
import { InfoRow, Section } from '@/shared/ui';

import { monthsPhrase } from './goalTexts';

type Props = {
  goal: CouponGoal;
  months: GoalMonth[];
  /** Months no bond for sale pays a coupon in, 0–11 */
  shortMonths: number[];
};

/** Each month of the goal's year: its coupons, and where they come from once the goal adds some. */
export function GoalMonthsSection({ goal, months, shortMonths }: Props) {
  const { currency } = goal;
  const hint = (month: GoalMonth, index: number) => {
    if (shortMonths.includes(index)) {
      return `Нестача ${formatMoney(round2(goal.monthly - month.plan), currency)}: жодна ОВДП у продажу не платить купон цього місяця`;
    }
    if (month.added === 0) return undefined;
    return `Купони плану ${formatMoney(month.plan, currency)} + купівлі під ціль ${formatMoney(month.added, currency)}`;
  };

  return (
    <Section
      title="По місяцях"
      footer={
        shortMonths.length
          ? `У ${monthsPhrase(shortMonths)} жодна ОВДП у продажу не платить купон, тож ці місяці до цілі не дотягують.`
          : undefined
      }
    >
      {months.map((month, index) => (
        <InfoRow
          key={MONTHS[index]}
          label={MONTHS[index]}
          hint={hint(month, index)}
          value={formatMoney(round2(month.plan + month.added), currency)}
        />
      ))}
    </Section>
  );
}
