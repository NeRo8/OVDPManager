import { Controller } from 'react-hook-form';
import { StyleSheet } from 'react-native-unistyles';

import { GOAL_BOND_MONTHS, useCouponGoal } from '@/features/coupon-goal';

import { CURRENCIES } from '@/entities/portfolio';

import { formatDate, formatMoney } from '@/shared/lib';
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
import { GoalPurchasesSection } from './GoalPurchasesSection';

type Props = {
  planName: string;
  onCreated: () => void;
};

const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({ label: currency, value: currency }));

/**
 * The coupon goal: the sum wanted every month, the year and the currency, then what to buy in the
 * year before and what it takes. The purchases follow every change; «Створити план» adds them to a
 * copy of the plan.
 */
export function CouponGoalForm({ planName, onCreated }: Props) {
  const { control, years, goal, plan, canCreate, submit } = useCouponGoal(onCreated);
  const create = () => void submit();
  const yearOptions = years.map((year) => ({ label: String(year), value: year }));
  const purchaseYear = goal ? goal.year - 1 : null;
  const startsLater = plan !== null && plan.from !== `${purchaseYear}-01-01`;

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
            <FieldRow
              label={`Купони на місяць, ${goal?.currency ?? 'UAH'}`}
              error={fieldState.error?.message}
            >
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
        name="year"
        render={({ field }) => (
          <SegmentedSection
            title="Рік купонів"
            footer={
              purchaseYear === null
                ? undefined
                : `Купівлі — у ${purchaseYear} році${startsLater && plan ? `, з ${formatDate(plan.from)}` : ''}.`
            }
            options={yearOptions}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

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

      {!goal || !plan ? (
        <EmptyState
          layout="inline"
          icon="flag-outline"
          title="Вкажіть ціль"
          message="Введіть, скільки купонів хочете отримувати щомісяця: тут з’являться ОВДП, які варто купити, коли і скільки на це потрібно грошей."
        />
      ) : (
        <>
          <GoalMonthsCard goal={goal} months={plan.months} />
          {plan.bonds.length === 0 && plan.shortMonths.length === 0 && (
            <EmptyState
              layout="inline"
              icon="checkmark-circle-outline"
              title="Ціль уже досягнута"
              message={`Купони плану вже дають щонайменше ${formatMoney(goal.monthly, goal.currency)} у кожному місяці ${goal.year} року. Підвищте ціль або оберіть інший рік.`}
            />
          )}
          {plan.bonds.length === 0 && plan.shortMonths.length > 0 && (
            <EmptyState
              layout="inline"
              icon="search-outline"
              title="Немає ОВДП для цілі"
              message={`Серед ОВДП у ${goal.currency}, розміщених за останні ${GOAL_BOND_MONTHS} місяців, немає таких, що платять купони у ${goal.year} році й погашаються пізніше. Оберіть іншу валюту або рік.`}
            />
          )}
          <GoalMonthsSection goal={goal} months={plan.months} shortMonths={plan.shortMonths} />
          {plan.bonds.length > 0 && purchaseYear !== null && (
            <>
              <GoalBondsSection bonds={plan.bonds} currency={goal.currency} year={goal.year} />
              <GoalMoneySection plan={plan} currency={goal.currency} year={purchaseYear} />
              <GoalPurchasesSection
                purchases={plan.purchases}
                planName={planName}
                year={goal.year}
              />
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
