import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import {
  DateField,
  Button,
  EmptyState,
  InfoRow,
  Input,
  Section,
  Separator,
  Typography,
  ScreenScrollView,
} from '@/shared/ui';
import { useAddHoldingForm } from '@/features/add-holding';
import { BondParameters, BondsUnavailable } from '@/entities/portfolio';
import { formatDate, formatMoney } from '@/shared/lib';

/**
 * Second step of adding a purchase: the date, amount and quantity for the chosen bond. A top-up
 * from the bond's screen opens here directly, without the bond list before it.
 */
export default function AddHoldingScreen() {
  const { isin, topUp } = useLocalSearchParams<{ isin: string; topUp?: string }>();
  const {
    bonds,
    error,
    refresh,
    today,
    bond,
    ownedQuantity,
    purchaseDate,
    setPurchaseDate,
    amountText,
    setAmountText,
    quantityText,
    setQuantityText,
    quantityPlaceholder,
    pricePerBond,
    dateProblem,
    preview,
    canSave,
    currency,
    save,
  } = useAddHoldingForm(isin);

  const header = (
    <Stack.Screen
      options={{
        title: ownedQuantity > 0 ? 'Докупити ОВДП' : 'Додати ОВДП',
      }}
    />
  );

  if (!bonds) {
    return (
      <>
        {header}
        <BondsUnavailable error={error} onRetry={refresh} />
      </>
    );
  }

  if (!bond) {
    return (
      <>
        {header}
        <EmptyState title={isin} message="Цієї ОВДП немає в даних НБУ." />
      </>
    );
  }

  return (
    <ScreenScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      {header}
      <Section
        title="ОВДП"
        footer={
          ownedQuantity > 0
            ? `У гаманці вже є ${ownedQuantity} шт — ця покупка додасться до них.`
            : undefined
        }
      >
        <InfoRow label="ISIN" value={bond.isin} />
      </Section>

      <BondParameters bond={bond} />

      <Section
        title="Покупка"
        footer={
          dateProblem ? (
            <Typography variant="caption1" tone="danger">
              {dateProblem}
            </Typography>
          ) : pricePerBond !== null ? (
            `Ціна 1 шт: ${formatMoney(pricePerBond, currency)}`
          ) : (
            'Кількість облігацій дивіться у застосунку банку чи брокера — від неї залежить сума купонів.'
          )
        }
      >
        <InfoRow
          label="Дата купівлі"
          value={<DateField value={purchaseDate} onChange={setPurchaseDate} maximumDate={today} />}
        />
        <Separator />
        <InfoRow
          label={`Сума, ${currency}`}
          value={
            <Input
              variant="inline"
              type="decimal"
              value={amountText}
              onChangeText={setAmountText}
              placeholder="0,00"
              style={styles.inlineInput}
            />
          }
        />
        <Separator />
        <InfoRow
          label="Кількість, шт"
          value={
            <Input
              variant="inline"
              type="integer"
              value={quantityText}
              onChangeText={setQuantityText}
              placeholder={quantityPlaceholder}
              style={styles.inlineInput}
            />
          }
        />
      </Section>

      {preview && !dateProblem && (
        <Section title={ownedQuantity > 0 ? 'Що дасть ця покупка' : 'Що ви отримаєте'}>
          <InfoRow
            label="Наступна виплата"
            value={
              preview.next
                ? `${formatDate(preview.next.date)} · ${formatMoney(preview.next.total, currency)}`
                : '—'
            }
          />
          <Separator />
          <InfoRow label="Купонів попереду" value={String(preview.couponsLeft)} />
          <Separator />
          <InfoRow label="Усього виплат" value={formatMoney(preview.income, currency)} />
          {preview.profit !== null && (
            <>
              <Separator />
              <InfoRow label="Чистий дохід" value={formatMoney(preview.profit, currency)} />
            </>
          )}
        </Section>
      )}

      <Button
        title="Зберегти"
        onPress={() => {
          // Back to where adding started: past the bond list, or straight back for a top-up.
          if (save()) router.dismiss(topUp ? 1 : 2);
        }}
        disabled={!canSave}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  inlineInput: { minWidth: 120 },
});
