import { Stack, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateField, Button, InfoRow, Section, Separator, screenContent } from '@/shared/ui';
import { round2 } from '@/shared/lib/number';
import { useAddHoldingForm } from '@/features/add-holding';
import { useColors, themeStyles } from '@/shared/theme';
import { formatDate, formatMoney } from '@/shared/lib';

export default function AddHoldingScreen() {
  const colors = useColors();
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
            <Text style={[styles.centerText, theme.text]}>{error}</Text>
            <Button title="Спробувати ще раз" onPress={refresh} style={styles.retry} />
          </>
        ) : (
          <>
            <ActivityIndicator />
            <Text style={[styles.centerText, theme.secondaryText]}>
              Завантажуємо перелік ОВДП з НБУ…
            </Text>
          </>
        )}
      </View>
    );
  }

  const inputStyle = [styles.input, theme.text];

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
        <TextInput
          value={bond && selected ? bond.isin : query}
          onChangeText={onChangeQuery}
          placeholder="Напр. UA4000227045 або 227045"
          placeholderTextColor={colors.secondaryText}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus={!topUpIsin}
          style={inputStyle}
        />
        {matches.map((match) => (
          <Fragment key={match.isin}>
            <Separator />
            <Pressable
              onPress={() => setSelected(match)}
              style={({ pressed }) => [styles.match, pressed && theme.muted]}
            >
              <Text style={[styles.matchIsin, theme.text]}>{match.isin}</Text>
              <Text style={[styles.matchInfo, theme.secondaryText]}>
                {match.rate}% · {match.currency} · до {formatDate(match.maturityDate)}
              </Text>
            </Pressable>
          </Fragment>
        ))}
        {!bond && query.trim().length >= 4 && matches.length === 0 && (
          <>
            <Separator />
            <Text style={[styles.hint, theme.dangerText]}>ОВДП з таким номером не знайдено</Text>
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
                <Text style={theme.dangerText}>{dateProblem}</Text>
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
                <TextInput
                  value={amountText}
                  onChangeText={setAmountText}
                  placeholder="0,00"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="decimal-pad"
                  style={[styles.inlineInput, theme.text]}
                />
              }
            />
            <Separator />
            <InfoRow
              label="Кількість, шт"
              value={
                <TextInput
                  value={quantityText}
                  onChangeText={(text) => setQuantityText(text.replace(/\D/g, ''))}
                  placeholder={
                    amountValid ? `≈ ${Math.max(1, Math.round(amount / bond.nominal))}` : '0'
                  }
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="number-pad"
                  style={[styles.inlineInput, theme.text]}
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
  centerText: { fontSize: 15, textAlign: 'center' },
  retry: { alignSelf: 'stretch' },
  input: {
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontVariant: ['tabular-nums'],
  },
  inlineInput: {
    fontSize: 17,
    textAlign: 'right',
    minWidth: 120,
    paddingVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  match: { paddingHorizontal: 16, paddingVertical: 10, gap: 2 },
  matchIsin: { fontSize: 16, fontWeight: '500', fontVariant: ['tabular-nums'] },
  matchInfo: { fontSize: 13 },
  hint: { fontSize: 14, paddingHorizontal: 16, paddingVertical: 12 },
});
