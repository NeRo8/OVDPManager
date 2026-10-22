import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { BondParameters, BondsUnavailable, removePlannedPurchase } from '@/entities/portfolio';
import { usePlanForm } from '@/features/investment-plan';
import { confirmDestructive, formatDate, formatMoney, showToast } from '@/shared/lib';
import {
  ActionRow,
  Button,
  DateField,
  EmptyState,
  InfoRow,
  Input,
  ScreenScrollView,
  Section,
  Separator,
  Typography,
} from '@/shared/ui';

type Props = { mode: 'new' | 'edit' };

export default function PlanFormScreen({ mode }: Props) {
  const { isin, id, planId } = useLocalSearchParams<{
    isin?: string;
    id?: string;
    planId?: string;
  }>();
  const form = usePlanForm(
    planId ?? '',
    mode === 'new' ? isin : undefined,
    mode === 'edit' ? id : undefined,
  );
  const { bond, existing, bonds, error, refresh, plan } = form;
  const header = (
    <Stack.Screen options={{ title: mode === 'edit' ? 'Змінити план' : 'План покупки' }} />
  );
  const deletePlanned = () => {
    if (!existing || !planId) return;
    confirmDestructive(
      'Видалити заплановану покупку?',
      `${existing.isin} · ${formatDate(existing.date)}`,
      'Видалити',
      () => {
        removePlannedPurchase(planId, existing.id);
        router.back();
      },
    );
  };

  if (!plan)
    return (
      <>
        {header}
        <EmptyState title="План не знайдено" message="Поверніться до списку планів." />
      </>
    );

  if (!bonds && existing && error)
    return (
      <>
        {header}
        <EmptyState title="Немає зв’язку з НБУ" message={error}>
          <Button title="Спробувати ще раз" onPress={refresh} />
          <Button title="Видалити з плану" variant="destructive" onPress={deletePlanned} />
        </EmptyState>
      </>
    );
  if (!bonds)
    return (
      <>
        {header}
        <BondsUnavailable error={error} onRetry={refresh} />
      </>
    );
  if (!bond || (mode === 'edit' && !existing)) {
    return (
      <>
        {header}
        <EmptyState
          title={existing ? 'Немає даних про ОВДП' : 'Покупку не знайдено'}
          message={
            existing
              ? 'Цієї ОВДП немає в даних НБУ. Планову покупку можна видалити.'
              : 'Поверніться до плану та виберіть ОВДП.'
          }
        >
          {existing && (
            <Button title="Видалити з плану" variant="destructive" onPress={deletePlanned} />
          )}
        </EmptyState>
      </>
    );
  }

  return (
    <ScreenScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      {header}
      <Section title="ОВДП">
        <InfoRow label="ISIN" value={bond.isin} />
      </Section>
      <BondParameters bond={bond} />
      <Section
        title="Запланована купівля"
        footer="Початкова ціна — номінал НБУ. За потреби змініть її на ціну банку чи брокера; комісії не враховані."
      >
        <InfoRow
          label="Коли купити"
          value={<DateField value={form.date} onChange={form.setDate} />}
        />
        <Separator />
        <InfoRow
          label="Кількість, шт"
          value={
            <Input
              variant="inline"
              type="integer"
              value={form.quantityText}
              onChangeText={form.setQuantityText}
              placeholder="0"
              style={styles.input}
            />
          }
        />
        <Separator />
        <InfoRow
          label={`Ціна 1 шт, ${bond.currency}`}
          value={
            <Input
              variant="inline"
              type="decimal"
              value={form.priceText}
              onChangeText={form.setPriceText}
              placeholder="0,00"
              style={styles.input}
            />
          }
        />
        <Separator />
        <InfoRow
          label="Сума вкладення"
          value={form.amount === null ? '—' : formatMoney(form.amount, bond.currency)}
        />
      </Section>

      {form.dateProblem && (
        <Typography variant="caption1" tone="danger" style={styles.message}>
          {form.dateProblem}
        </Typography>
      )}

      {form.total && (
        <Section title="Очікуваний результат">
          <InfoRow label="Вкладете" value={formatMoney(form.amount!, bond.currency)} />
          <Separator />
          <InfoRow label="Купони" value={formatMoney(form.total.coupons, bond.currency)} />
          <Separator />
          <InfoRow
            label="Погашення"
            value={
              form.total.complete
                ? formatMoney(form.total.redemption, bond.currency)
                : 'Немає даних НБУ'
            }
          />
          {form.total.complete && (
            <>
              <Separator />
              <InfoRow
                label="Усі виплати"
                value={formatMoney(form.total.proceeds, bond.currency)}
              />
              <Separator />
              <InfoRow
                label="Чистий результат"
                value={formatMoney(form.total.profit, bond.currency)}
              />
              <Separator />
              <InfoRow label="Дохідність за весь строк" value={`${form.total.returnPercent}%`} />
            </>
          )}
          {form.nextPayment && (
            <>
              <Separator />
              <InfoRow
                label="Перша виплата"
                value={`${formatDate(form.nextPayment.date)} · ${formatMoney(form.nextPayment.total, bond.currency)}`}
              />
            </>
          )}
        </Section>
      )}

      <Button
        title="Зберегти покупку"
        onPress={() => {
          if (form.problem) {
            showToast({ tone: 'error', title: 'Покупку не збережено', message: form.problem });
            return;
          }
          if (form.save()) router.dismiss(mode === 'edit' ? 1 : 2);
        }}
      />
      {existing && (
        <Section>
          <ActionRow title="Видалити з плану" onPress={deletePlanned} />
        </Section>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  input: { minWidth: 110 },
  message: { marginHorizontal: theme.space.lg },
}));
