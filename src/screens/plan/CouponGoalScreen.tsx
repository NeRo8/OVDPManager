import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { FieldRow } from '@/components/form/FieldRow';
import { Input } from '@/components/form/Input';
import type { PeriodRange } from '@/components/form/periodRange';
import { PeriodRangeSelector } from '@/components/form/PeriodRangeSelector';
import { SegmentedSection } from '@/components/form/SegmentedSection';
import { FormScrollView } from '@/components/layout/FormScrollView';
import { Section } from '@/components/layout/Section';
import { BondsGate } from '@/components/portfolio/BondsGate';
import { useKeyRate } from '@/hooks/useKeyRate.hook';
import { useWallet } from '@/hooks/useWallet.hook';
import { planCouponGoal } from '@/lib/coupon-goal/couponGoal';
import {
  type CouponGoalFormInput,
  type CouponGoalFormValues,
  couponGoalFormSchema,
} from '@/lib/coupon-goal/couponGoalForm.schema';
import {
  firstPurchaseYear,
  goalPurchaseSpan,
  goalYears,
  MAX_INCOME_YEARS,
  MAX_PURCHASE_YEARS,
} from '@/lib/coupon-goal/goalSpans';
import { CURRENCIES } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';
import { showToast } from '@/stores/appSettings';
import { createCouponGoalPlan } from '@/stores/plans';
import { formatDate } from '@/utils/date';

import { CouponGoalPreview } from './CouponGoalPreview';

const currencies = CURRENCIES.map((value) => ({ label: value, value }));

export default function CouponGoalScreen() {
  const wallet = useWallet();
  const { today, bonds, plan } = wallet;
  const years = goalYears(today);
  const saved = plan?.goal && years.includes(plan.goal.year) ? plan.goal : undefined;
  const firstYear = firstPurchaseYear(today);
  const purchaseEndYear = saved
    ? Math.max(firstYear, Math.min(saved.purchaseEndYear ?? saved.year - 1, saved.year - 1))
    : years[0] - 1;
  const { rate } = useKeyRate(today);
  const form = useForm<CouponGoalFormInput, unknown, CouponGoalFormValues>({
    resolver: zodResolver(couponGoalFormSchema),
    mode: 'onChange',
    defaultValues: {
      kind: saved?.kind ?? 'all',
      currency: saved?.currency ?? 'UAH',
      year: saved?.year ?? years[0],
      incomeYears: saved?.incomeYears ?? 1,
      purchaseEndYear,
      purchaseYears: saved ? Math.min(saved.purchaseYears, purchaseEndYear - firstYear + 1) : 1,
      payouts: saved?.reinvest === false ? 'withdraw' : 'reinvest',
      monthly: saved ? String(saved.monthly) : '',
    },
  });
  const values = useWatch({ control: form.control });
  const parsed = couponGoalFormSchema.safeParse(values);
  const goal = parsed.success ? parsed.data : null;
  const baseOperations = wallet.operations.filter(
    (operation) => !(operation.goalGenerated && operation.planned),
  );
  const baseWallet = buildWallet(baseOperations, wallet.byIsin, today);
  const preview = goal && bonds ? planCouponGoal(baseWallet, bonds, goal, rate) : null;
  const year = values.year ?? years[0];
  const purchaseEnd = values.purchaseEndYear ?? year - 1;
  const purchaseYears = values.purchaseYears ?? 1;
  const incomeYears = values.incomeYears ?? 1;
  const purchaseSpan = goalPurchaseSpan(
    { year, purchaseEndYear: purchaseEnd, purchaseYears },
    today,
  );
  const missingData =
    goal &&
    baseWallet.positions.some(
      (position) => position.currency === goal.currency && !position.results?.complete,
    );

  const changePeriods = ([purchaseStart, purchaseStop, couponStart, couponStop]: PeriodRange) => {
    form.setValue('purchaseEndYear', purchaseStop - 1);
    form.setValue('purchaseYears', purchaseStop - purchaseStart);
    form.setValue('year', couponStart);
    form.setValue('incomeYears', couponStop - couponStart, { shouldValidate: true });
  };

  const submit = form.handleSubmit((validGoal) => {
    if (!preview?.complete || !preview.purchases.length || missingData) return;
    try {
      const name = createCouponGoalPlan(validGoal, preview.purchases);
      if (!name) throw new Error('Немає активного плану');
      showToast({ tone: 'success', title: 'План з ціллю створено', message: name });
      router.back();
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'План не створено',
        message: error instanceof Error ? error.message : 'Спробуйте ще раз.',
      });
    }
  });

  return (
    <BondsGate>
      <FormScrollView>
        <Section
          title="Ціль"
          footer="Мета — сума купонів у кожному місяці. Погашення повертає номінал і не є купонним доходом."
        >
          <Controller
            control={form.control}
            name="monthly"
            render={({ field, fieldState }) => (
              <FieldRow
                label={`Купони на місяць, ${values.currency ?? 'UAH'}`}
                error={fieldState.error?.message}
              >
                <Input
                  variant="inline"
                  type="decimal"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="5 000"
                />
              </FieldRow>
            )}
          />
        </Section>
        <Controller
          control={form.control}
          name="currency"
          render={({ field }) => (
            <SegmentedSection
              title="Валюта"
              options={currencies}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={form.control}
          name="kind"
          render={({ field }) => (
            <SegmentedSection
              title="Вид облігацій для купівлі"
              options={[
                { value: 'all', label: 'Усі' },
                { value: 'ovdp', label: 'ОВДП' },
                { value: 'ozdp', label: 'ОЗДП' },
              ]}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Section
          title="Періоди"
          footer={`Інвестування: ${formatDate(purchaseSpan.from)} – ${formatDate(purchaseSpan.to)}. Інвестування — до ${MAX_PURCHASE_YEARS} років, купони — до ${MAX_INCOME_YEARS}. Перетягніть повзунки, щоб змінити межі.`}
        >
          <PeriodRangeSelector
            value={[purchaseEnd - purchaseYears + 1, purchaseEnd + 1, year, year + incomeYears]}
            limits={{
              min: firstYear,
              max: years[years.length - 1] + MAX_INCOME_YEARS,
              latestCouponStart: years[years.length - 1],
              maxPurchaseYears: MAX_PURCHASE_YEARS,
              maxCouponYears: MAX_INCOME_YEARS,
            }}
            onChange={changePeriods}
          />
        </Section>
        <Controller
          control={form.control}
          name="payouts"
          render={({ field }) => (
            <SegmentedSection
              title="Виплати в роки купівель"
              options={[
                { value: 'reinvest', label: 'Реінвестувати' },
                { value: 'withdraw', label: 'Забирати' },
              ]}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <CouponGoalPreview
          goal={goal}
          preview={preview}
          missingData={!!missingData}
          onCreate={() => void submit()}
        />
      </FormScrollView>
    </BondsGate>
  );
}
