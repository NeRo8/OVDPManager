import { Controller } from 'react-hook-form';
import { StyleSheet } from 'react-native-unistyles';

import { GOAL_BOND_MONTHS, goalYearMonths, useCouponGoal } from '@/features/coupon-goal';

import { CURRENCIES, goalLastYear } from '@/entities/portfolio';

import { formatMoney } from '@/shared/lib';
import {
  Button,
  EmptyState,
  FieldRow,
  FormScrollView,
  Input,
  Section,
  SegmentedSection,
} from '@/shared/ui';

import { GoalBondsSection } from './GoalBondsSection';
import { GoalMoneySection } from './GoalMoneySection';
import { GoalMonthsCard } from './GoalMonthsCard';
import { GoalMonthsSection } from './GoalMonthsSection';
import { GoalPeriodSections } from './GoalPeriodSections';
import { GoalPurchasesSection } from './GoalPurchasesSection';
import { inYears, ofYears } from './goalTexts';

type Props = {
  planName: string;
  onCreated: () => void;
};

const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({ label: currency, value: currency }));

/**
 * The coupon goal: the sum wanted every month, the currency, «Роки купонів», «Роки купівель» before
 * them and whether their payments are reinvested, then what to buy and what it takes. The purchases
 * follow every change; «Створити план» adds them to a copy of the plan.
 */
export function CouponGoalForm({ planName, onCreated }: Props) {
  const {
    control,
    currency,
    years,
    year,
    purchaseYears,
    purchaseSpan,
    selectYear,
    goal,
    plan,
    canCreate,
    submit,
  } = useCouponGoal(onCreated);
  const create = () => void submit();
  const goalYears = goal
    ? Array.from({ length: goal.incomeYears }, (_, index) => goal.year + index)
    : [];

  return (
    <FormScrollView>
      <Section
        title="Ціль"
        footer="Ціль — у купонах: це гроші, що регулярно надходять на рахунок. Погашення повертає номінал, а не приносить новий дохід."
      >
        <Controller
          control={control}
          name="monthly"
          render={({ field, fieldState }) => (
            <FieldRow label={`Купони на місяць, ${currency}`} error={fieldState.error?.message}>
              <Input
                variant="inline"
                type="decimal"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="5 000"
                style={styles.inlineInput}
              />
            </FieldRow>
          )}
        />
      </Section>

      <Controller
        control={control}
        name="currency"
        render={({ field }) => (
          <SegmentedSection
            title="Валюта"
            options={CURRENCY_OPTIONS}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <GoalPeriodSections
        control={control}
        years={years}
        year={year}
        purchaseYears={purchaseYears}
        purchaseSpan={purchaseSpan}
        selectYear={selectYear}
      />

      {!goal || !plan ? (
        <EmptyState
          layout="inline"
          icon="flag-outline"
          title="Вкажіть ціль"
          message="Введіть, скільки купонів хочете отримувати щомісяця: тут з’являться ОВДП, які варто купити, коли і скільки на це потрібно грошей."
        />
      ) : (
        <>
          {goalYears.map((cardYear) => (
            <GoalMonthsCard
              key={cardYear}
              goal={goal}
              year={cardYear}
              months={goalYearMonths(plan.months, goal, cardYear)}
            />
          ))}
          {plan.bonds.length === 0 && plan.shortMonths.length === 0 && (
            <EmptyState
              layout="inline"
              icon="checkmark-circle-outline"
              title="Ціль уже досягнута"
              message={`Купони плану вже дають щонайменше ${formatMoney(goal.monthly, goal.currency)} у кожному місяці ${ofYears(goal.year, goalLastYear(goal))}. Підвищте ціль або оберіть інші роки.`}
            />
          )}
          {plan.bonds.length === 0 && plan.shortMonths.length > 0 && (
            <EmptyState
              layout="inline"
              icon="search-outline"
              title="Немає ОВДП для цілі"
              message={`Серед ОВДП у ${goal.currency}, розміщених за останні ${GOAL_BOND_MONTHS} місяців, немає таких, що платять купони в місяці з нестачею ${inYears(goal.year, goalLastYear(goal))}. Оберіть іншу валюту або роки.`}
            />
          )}
          <GoalMonthsSection goal={goal} months={plan.months} shortMonths={plan.shortMonths} />
          {plan.bonds.length > 0 && (
            <>
              <GoalBondsSection bonds={plan.bonds} goal={goal} />
              <GoalMoneySection plan={plan} goal={goal} />
              <GoalPurchasesSection purchases={plan.purchases} planName={planName} goal={goal} />
              <Button title="Створити план з ціллю" disabled={!canCreate} onPress={create} />
            </>
          )}
        </>
      )}
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  inlineInput: { minWidth: 120 },
});
