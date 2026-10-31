import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState, useWatch } from 'react-hook-form';

import { createGoalPlan, useKeyRate, useWallet } from '@/entities/portfolio';

import { showToast } from '@/shared/lib';

import { planCouponGoal } from './couponGoal';
import {
  type CouponGoalFormInput,
  type CouponGoalFormValues,
  couponGoalFormSchema,
} from './couponGoalForm.schema';
import { fitPurchaseYears, goalPurchaseSpan, goalPurchaseYears, goalYears } from './goalSpans';

/**
 * The coupon goal of the active plan: the form, the purchases worked out from it on every change
 * and the «План з ціллю» they make. Nothing is saved until that plan is created.
 */
export function useCouponGoal(onCreated: () => void) {
  const wallet = useWallet();
  const { today, bonds } = wallet;
  const years = goalYears(today);
  const keyRate = useKeyRate(today);
  // The plan's saved goal, while its coupons can still be planned for; otherwise a fresh one.
  const saved = wallet.plan?.goal;
  const form = useForm<CouponGoalFormInput, unknown, CouponGoalFormValues>({
    resolver: zodResolver(couponGoalFormSchema),
    mode: 'onChange',
    defaultValues:
      saved && years.includes(saved.year)
        ? {
            currency: saved.currency,
            year: saved.year,
            incomeYears: saved.incomeYears,
            purchaseYears: fitPurchaseYears(saved.year, saved.purchaseYears, today),
            payouts: saved.reinvest ? 'reinvest' : 'withdraw',
            monthly: String(saved.monthly),
          }
        : {
            currency: 'UAH',
            year: years[0],
            incomeYears: 1,
            purchaseYears: 1,
            payouts: 'reinvest',
            monthly: '',
          },
  });

  // Read through hooks, not `form.formState`: the React Compiler would cache a read of `form`.
  const { isValid } = useFormState({ control: form.control });
  const values = useWatch({ control: form.control });
  const parsed = couponGoalFormSchema.safeParse(values);
  const goal = parsed.success ? parsed.data : null;
  const plan = goal && bonds ? planCouponGoal(wallet, bonds, goal, keyRate) : null;
  const year = values.year ?? years[0];
  const purchaseYears = goalPurchaseYears(year, today);
  // What is left of «Роки купівель», shown under their choice even before the sum is typed.
  const purchaseSpan = goalPurchaseSpan({ year, purchaseYears: values.purchaseYears ?? 1 }, today);

  /** A later start leaves more years to buy in; an earlier one may cut those already chosen. */
  const selectYear = (next: number) => {
    form.setValue('year', next, { shouldValidate: true });
    const fitted = fitPurchaseYears(next, values.purchaseYears ?? 1, today);
    form.setValue('purchaseYears', fitted, { shouldValidate: true });
  };

  const submit = form.handleSubmit((goal) => {
    if (!plan?.purchases.length) return;
    const name = createGoalPlan(goal, plan.purchases);
    if (name) showToast({ tone: 'success', title: 'План з ціллю створено', message: name });
    onCreated();
  });

  return {
    control: form.control,
    currency: values.currency ?? 'UAH',
    years,
    year,
    purchaseYears,
    purchaseSpan,
    selectYear,
    goal,
    plan,
    canCreate: isValid && Boolean(plan?.purchases.length),
    submit,
  };
}
