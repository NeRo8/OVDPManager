import { Stack, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  DateField,
  Button,
  InfoRow,
  Input,
  Section,
  Separator,
  Typography,
  screenContent,
} from '@/shared/ui';
import { round2 } from '@/shared/lib/number';
import { useAddHoldingForm } from '@/features/add-holding';
import { themeStyles } from '@/shared/theme';
import { formatDate, formatMoney } from '@/shared/lib';

export default function AddHoldingScreen() {
  const theme = themeStyles;
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
    amount,
    quantity,
    amountValid,
    quantityValid,
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
      <View style={[styles.center, theme.background]}>
        {title}
        {error ? (
          <>
            <Typography variant="subhead" align="center">
              {error}
            </Typography>
            <Button title="Спробувати ще раз" onPress={refresh} style={styles.retry} />
          </>
        ) : (
          <>
            <ActivityIndicator />
            <Typography variant="subhead" align="center" tone="secondary">
              Завантажуємо перелік ОВДП з НБУ…
            </Typography>
          </>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={theme.background}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
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
              style={({ pressed }) => [styles.match, pressed && theme.muted]}
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
              ) : amountValid && quantityValid ? (
                `Ціна 1 шт: ${formatMoney(round2(amount / quantity), currency)}`
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
                  placeholder={
                    amountValid ? `≈ ${Math.max(1, Math.round(amount / bond.nominal))}` : '0'
                  }
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
              {amountValid && (
                <>
                  <Separator />
                  <InfoRow
                    label="Чистий дохід"
                    value={formatMoney(round2(preview.income - amount), currency)}
                  />
                </>
              )}
            </Section>
          )}

          <Button title="Зберегти" onPress={save} disabled={!canSave} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  retry: { alignSelf: 'stretch' },
  inlineInput: { minWidth: 120 },
  match: { paddingHorizontal: 16, paddingVertical: 10, gap: 2 },
  hint: { paddingHorizontal: 16, paddingVertical: 12 },
});
