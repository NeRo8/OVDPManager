import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState, useWatch } from 'react-hook-form';

import { createGoalPlan, useKeyRate, useWallet } from '@/entities/portfolio';

import { showToast } from '@/shared/lib';

import { goalYears, planCouponGoal } from './couponGoal';
import {
  type CouponGoalFormInput,
  type CouponGoalFormValues,
  couponGoalFormSchema,
} from './couponGoalForm.schema';

/**
 * The coupon goal of the active plan: the form, the purchases worked out from it on every change
 * and the «План з ціллю» they make. Nothing is saved until that plan is created.
 */
export function useCouponGoal(onCreated: () => void) {
  const wallet = useWallet();
  const { today, bonds } = wallet;
  const years = goalYears(today);
  const keyRate = useKeyRate(today);
  // The plan's saved goal, while its year can still be planned for; otherwise a fresh one.
  const saved = wallet.plan?.goal;
  const form = useForm<CouponGoalFormInput, unknown, CouponGoalFormValues>({
    resolver: zodResolver(couponGoalFormSchema),
    mode: 'onChange',
    defaultValues:
      saved && years.includes(saved.year)
        ? { currency: saved.currency, year: saved.year, monthly: String(saved.monthly) }
        : { currency: 'UAH', year: years[0], monthly: '' },
  });

  // Read through hooks, not `form.formState`: the React Compiler would cache a read of `form`.
  const { isValid } = useFormState({ control: form.control });
  const values = useWatch({ control: form.control });
  const parsed = couponGoalFormSchema.safeParse(values);
  const goal = parsed.success ? parsed.data : null;
  const plan = goal && bonds ? planCouponGoal(wallet, bonds, goal, keyRate) : null;

  const submit = form.handleSubmit((values) => {
    if (!plan?.purchases.length) return;
    const name = createGoalPlan(values, plan.purchases);
    if (name) showToast({ tone: 'success', title: 'План з ціллю створено', message: name });
    onCreated();
  });

  return {
    control: form.control,
    years,
    goal,
    plan,
    canCreate: isValid && Boolean(plan?.purchases.length),
    submit,
  };
}
