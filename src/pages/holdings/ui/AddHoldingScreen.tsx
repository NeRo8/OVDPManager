import { Stack, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  DateField,
  Button,
  InfoRow,
  Input,
  Section,
  Separator,
  Typography,
  ScreenScrollView,
} from '@/shared/ui';
import { useAddHoldingForm } from '@/features/add-holding';
import { BondsUnavailable } from '@/entities/portfolio';
import { formatDate, formatMoney } from '@/shared/lib';

export default function AddHoldingScreen() {
  const { isin: topUpIsin } = useLocalSearchParams<{ isin?: string }>();
  const {
    bonds,
    error,
    refresh,
    today,
    query,
    selected,
    setSelected,
    onChangeQuery,
    bond,
    matches,
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
    couponPerBond,
    save,
  } = useAddHoldingForm(topUpIsin);

  const title = <Stack.Screen options={{ title: topUpIsin ? 'Докупити ОВДП' : 'Додати ОВДП' }} />;

  if (!bonds) {
    return (
      <>
        {title}
        <BondsUnavailable error={error} onRetry={refresh} />
      </>
    );
  }

  return (
    <ScreenScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      {title}
      <Section
        title="Номер ОВДП (ISIN)"
        footer={
          ownedQuantity > 0
            ? `У гаманці вже є ${ownedQuantity} шт — ця покупка додасться до них.`
            : undefined
        }
      >
        <Input
          value={bond && selected ? bond.isin : query}
          onChangeText={onChangeQuery}
          placeholder="Напр. UA4000227045 або 227045"
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus={!topUpIsin}
        />
        {matches.map((match) => (
          <Fragment key={match.isin}>
            <Separator />
            <Pressable
              onPress={() => setSelected(match)}
              style={({ pressed }) => [styles.match, pressed && styles.pressed]}
            >
              <Typography variant="callout" tabular>
                {match.isin}
              </Typography>
              <Typography variant="caption1" tone="secondary">
                {match.rate}% · {match.currency} · до {formatDate(match.maturityDate)}
              </Typography>
            </Pressable>
          </Fragment>
        ))}
        {!bond && query.trim().length >= 4 && matches.length === 0 && (
          <>
            <Separator />
            <Typography variant="footnote" tone="danger" style={styles.hint}>
              ОВДП з таким номером не знайдено
            </Typography>
          </>
        )}
      </Section>

      {bond && (
        <>
          <Section title="Параметри випуску">
            <InfoRow label="Ставка купону" value={`${bond.rate}% річних`} />
            <Separator />
            <InfoRow label="Номінал" value={formatMoney(bond.nominal, bond.currency)} />
            <Separator />
            <InfoRow label="Купон на 1 шт" value={couponPerBond} />
            <Separator />
            <InfoRow label="Погашення" value={formatDate(bond.maturityDate)} />
          </Section>

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
              value={
                <DateField value={purchaseDate} onChange={setPurchaseDate} maximumDate={today} />
              }
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

          <Button title="Зберегти" onPress={save} disabled={!canSave} />
        </>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  inlineInput: { minWidth: 120 },
  match: { paddingHorizontal: 16, paddingVertical: 10, gap: 2 },
  pressed: { backgroundColor: theme.muted },
  hint: { paddingHorizontal: 16, paddingVertical: 12 },
}));
