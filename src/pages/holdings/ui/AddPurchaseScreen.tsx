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
import { useAddPurchaseForm } from '@/features/add-purchase';
import { BondParameters, BondsUnavailable } from '@/entities/portfolio';
import { formatDate, formatMoney, showToast } from '@/shared/lib';

/**
 * Second step of adding a purchase to the active plan: the date, quantity and price for the chosen
 * bond. The date may lie ahead for a planned purchase. A top-up from the bond's screen opens here
 * directly, without the bond list before it.
 */
export default function AddPurchaseScreen() {
  const { isin, topUp } = useLocalSearchParams<{ isin: string; topUp?: string }>();
  const {
    bonds,
    error,
    refresh,
    bond,
    ownedQuantity,
    purchaseDate,
    setPurchaseDate,
    quantityText,
    setQuantityText,
    priceText,
    setPriceText,
    amount,
    isPlanned,
    dateProblem,
    preview,
    problem,
    currency,
    save,
  } = useAddPurchaseForm(isin);

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
            ? `У плані вже є ${ownedQuantity} шт — ця покупка додасться до них.`
            : undefined
        }
      >
        <InfoRow label="ISIN" value={bond.isin} />
      </Section>

      <BondParameters bond={bond} />

      <Section
        title={isPlanned ? 'Запланована покупка' : 'Покупка'}
        footer={
          dateProblem ? (
            <Typography variant="caption1" tone="danger">
              {dateProblem}
            </Typography>
          ) : isPlanned ? (
            `Дата ще попереду: покупка буде в плані як запланована й почне приносити виплати після ${formatDate(purchaseDate)}.`
          ) : (
            'Початкова ціна — номінал НБУ; змініть її на ціну з застосунку банку чи брокера.'
          )
        }
      >
        <InfoRow
          label="Дата купівлі"
          value={<DateField value={purchaseDate} onChange={setPurchaseDate} />}
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
              placeholder="0"
              style={styles.inlineInput}
            />
          }
        />
        <Separator />
        <InfoRow
          label={`Ціна 1 шт, ${currency}`}
          value={
            <Input
              variant="inline"
              type="decimal"
              value={priceText}
              onChangeText={setPriceText}
              placeholder="0,00"
              style={styles.inlineInput}
            />
          }
        />
        <Separator />
        <InfoRow label="Сума" value={amount === null ? '—' : formatMoney(amount, currency)} />
      </Section>

      {preview && !dateProblem && (
        <Section title={ownedQuantity > 0 ? 'Що дасть ця покупка' : 'Що ви отримаєте'}>
          <InfoRow
            label="Наступна виплата"
            value={
              preview.nextPayment
                ? `${formatDate(preview.nextPayment.date)} · ${formatMoney(preview.nextPayment.total, currency)}`
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
          if (problem) {
            showToast({ tone: 'error', title: 'Покупку не збережено', message: problem });
            return;
          }
          // Back to where adding started: past the bond list, or straight back for a top-up.
          if (save()) router.dismiss(topUp ? 1 : 2);
        }}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  inlineInput: { minWidth: 120 },
});
