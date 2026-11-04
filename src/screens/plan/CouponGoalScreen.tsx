import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { FieldRow } from '@/components/form/FieldRow';
import { Input } from '@/components/form/Input';
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
  fitPurchaseYears,
  goalPurchaseYears,
  goalYears,
  GOAL_INCOME_YEARS,
} from '@/lib/coupon-goal/goalSpans';
import { CURRENCIES } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';
import { showToast } from '@/stores/appSettings';
import { createCouponGoalPlan } from '@/stores/plans';

import { CouponGoalPreview } from './CouponGoalPreview';

const currencies = CURRENCIES.map((value) => ({ label: value, value }));
const options = (values: number[]) => values.map((value) => ({ label: String(value), value }));

export default function CouponGoalScreen() {
  const wallet = useWallet();
  const { today, bonds, plan } = wallet;
  const years = goalYears(today);
  const saved = plan?.goal && years.includes(plan.goal.year) ? plan.goal : undefined;
  const { rate } = useKeyRate(today);
  const form = useForm<CouponGoalFormInput, unknown, CouponGoalFormValues>({
    resolver: zodResolver(couponGoalFormSchema),
    mode: 'onChange',
    defaultValues: {
      kind: saved?.kind ?? 'all',
      currency: saved?.currency ?? 'UAH',
      year: saved?.year ?? years[0],
      incomeYears: saved?.incomeYears ?? 1,
      purchaseYears: saved ? fitPurchaseYears(saved.year, saved.purchaseYears, today) : 1,
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
  const purchaseYears = goalPurchaseYears(year, today);
  const missingData =
    goal &&
    baseWallet.positions.some(
      (position) => position.currency === goal.currency && !position.results?.complete,
    );

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
        <Controller
          control={form.control}
          name="year"
          render={({ field }) => (
            <SegmentedSection
              title="Купони з року"
              options={options(years)}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                form.setValue(
                  'purchaseYears',
                  fitPurchaseYears(value, values.purchaseYears ?? 1, today),
                  { shouldValidate: true },
                );
              }}
            />
          )}
        />
        <Controller
          control={form.control}
          name="incomeYears"
          render={({ field }) => (
            <SegmentedSection
              title="Скільки років отримувати купони"
              options={options(GOAL_INCOME_YEARS)}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={form.control}
          name="purchaseYears"
          render={({ field }) => (
            <SegmentedSection
              title="Скільки років купувати"
              options={options(purchaseYears)}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
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
