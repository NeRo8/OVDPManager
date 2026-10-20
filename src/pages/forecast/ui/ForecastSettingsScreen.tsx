import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import {
  NumberField,
  SegmentedSelect,
  InfoRow,
  Section,
  Separator,
  screenContent,
  YearNav,
} from '@/shared/ui';
import { TERM_OPTIONS, MAX_PLAN_YEARS, useForecastSettings } from '@/features/forecast';
import { formatDate, formatMoney } from '@/shared/lib';
import { useColors, themeStyles } from '@/shared/theme';

export default function ForecastSettingsScreen() {
  const colors = useColors();
  const theme = themeStyles;
  const {
    plan,
    nbuRate,
    currentYear,
    planEndYear,
    setMonthlyUsd,
    setUsdRate,
    setContributeUntilYear,
    setReinvestUntilYear,
    setReinvestNominal,
    setYieldRate,
    setTermMonths,
  } = useForecastSettings();

  return (
    <ScrollView
      style={theme.background}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Section
        title="Поповнення"
        footer={
          nbuRate
            ? `Курс НБУ на ${formatDate(nbuRate.date)}: ${formatMoney(nbuRate.rate, 'UAH')}. Залиште курс порожнім, щоб рахувати за курсом НБУ.`
            : 'Немає курсу НБУ — введіть курс, щоб врахувати поповнення.'
        }
      >
        <InfoRow
          label="Щомісяця, $"
          value={<NumberField value={plan.monthlyUsd} onChange={setMonthlyUsd} placeholder="0" />}
        />
        <Separator />
        <InfoRow
          label="Курс, ₴ за $"
          value={
            <NumberField
              value={plan.usdRate}
              onChange={setUsdRate}
              placeholder={nbuRate ? `${String(nbuRate.rate).replace('.', ',')} (НБУ)` : '0,00'}
            />
          }
        />
        <Separator />
        <InfoRow
          label="До кінця року"
          value={
            <YearNav
              compact
              year={plan.contributeUntilYear}
              min={currentYear}
              max={currentYear + MAX_PLAN_YEARS}
              onChange={setContributeUntilYear}
            />
          }
        />
      </Section>

      <Section
        title="Реінвестування"
        footer={`Купони, отримані до кінця ${plan.reinvestUntilYear} року, та дохід нових ОВДП докуповуються в короткі ОВДП наступного місяця. Самі короткі ОВДП з плану після погашення купуються знову до кінця ${planEndYear} року, потім номінал повертається.`}
      >
        <InfoRow
          label="До кінця року"
          value={
            <YearNav
              compact
              year={plan.reinvestUntilYear}
              min={currentYear}
              max={currentYear + MAX_PLAN_YEARS}
              onChange={setReinvestUntilYear}
            />
          }
        />
        <Separator />
        <InfoRow
          label="І номінал погашених ОВДП"
          value={
            <Switch
              value={plan.reinvestNominal}
              onValueChange={setReinvestNominal}
              trackColor={{ true: colors.accent, false: colors.border }}
              accessibilityLabel="Реінвестувати номінал погашених ОВДП"
            />
          }
        />
      </Section>

      <Section
        title="Короткі ОВДП"
        footer="Ставки майбутніх аукціонів невідомі: прогноз вважає дохідність незмінною, а купон — раз на пів року (за 3 міс — при погашенні). Купівля — 1-го числа місяця, без округлення до цілих облігацій."
      >
        <InfoRow
          label="Річна дохідність, %"
          value={<NumberField value={plan.yieldRate} onChange={setYieldRate} placeholder="0" />}
        />
        <Separator />
        <View style={styles.termRow}>
          <Text style={[styles.termLabel, theme.secondaryText]}>Строк до погашення</Text>
          <SegmentedSelect
            options={TERM_OPTIONS.map((months) => ({ label: `${months} міс`, value: months }))}
            value={plan.termMonths}
            onChange={setTermMonths}
          />
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  termRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  termLabel: { fontSize: 15 },
});
