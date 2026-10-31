import { type Control, Controller } from 'react-hook-form';

import {
  type CouponGoalFormInput,
  type CouponGoalFormValues,
  GOAL_INCOME_YEARS,
} from '@/features/coupon-goal';

import { formatDate } from '@/shared/lib';
import { SegmentedSection } from '@/shared/ui';

import { inYears } from './goalTexts';

type Props = {
  control: Control<CouponGoalFormInput, unknown, CouponGoalFormValues>;
  /** The years coupons can start in */
  years: number[];
  /** The one chosen */
  year: number;
  /** The choices of «Роки купівель» before the year chosen */
  purchaseYears: number[];
  /** What is left of «Роки купівель» as chosen */
  purchaseSpan: { from: string; to: string };
  selectYear: (year: number) => void;
};

const toOptions = (values: number[]) => values.map((value) => ({ label: String(value), value }));

const PAYOUT_OPTIONS: { label: string; value: CouponGoalFormInput['payouts'] }[] = [
  { label: 'Реінвестувати', value: 'reinvest' },
  { label: 'Забирати', value: 'withdraw' },
];

/**
 * When the goal's coupons come and when it buys for them: «Роки купонів» from a year, «Роки
 * купівель» right before them, and whether the payments of those go to the purchases.
 */
export function GoalPeriodSections({
  control,
  years,
  year,
  purchaseYears,
  purchaseSpan,
  selectYear,
}: Props) {
  return (
    <>
      <Controller
        control={control}
        name="year"
        render={({ field }) => (
          <SegmentedSection
            title="Купони з року"
            options={toOptions(years)}
            value={field.value}
            onChange={selectYear}
          />
        )}
      />

      <Controller
        control={control}
        name="incomeYears"
        render={({ field }) => (
          <SegmentedSection
            title="Скільки років отримувати купони"
            footer={`Ціль — купони щомісяця ${inYears(year, year + field.value - 1)}.`}
            options={toOptions(GOAL_INCOME_YEARS)}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="purchaseYears"
        render={({ field }) => (
          <SegmentedSection
            title="Скільки років купувати"
            footer={`Купівлі — з ${formatDate(purchaseSpan.from)} до ${formatDate(purchaseSpan.to)}, перед роками купонів.`}
            options={toOptions(purchaseYears)}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="payouts"
        render={({ field }) => (
          <SegmentedSection
            title="Виплати в роки купівель"
            footer={
              field.value === 'reinvest'
                ? 'Купони й погашення, що надходять до кінця купівель, — і ОВДП плану, і щойно куплених під ціль — оплачують наступні купівлі, тож власних коштів треба менше.'
                : 'Купони й погашення, що надходять до кінця купівель, ви забираєте: купівлі оплачуються лише власними коштами.'
            }
            options={PAYOUT_OPTIONS}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
    </>
  );
}
