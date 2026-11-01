import { useLocalSearchParams } from 'expo-router';
import { Controller } from 'react-hook-form';
import { StyleSheet } from 'react-native-unistyles';

import { ANNUAL_YIELD_RANGE, isPlannedPurchase } from '@/entities/portfolio';

import { formatDate, formatMoney, formatRateNumber } from '@/shared/lib';
import { EmptyState, FieldRow, FormScrollView, InfoRow, Input, Section } from '@/shared/ui';

import { useSaleForm } from '../model/useSaleForm.hook';

import { HintsSection } from './HintsSection';
import { SalePricesSection } from './SalePricesSection';

/**
 * Selling a bond of the wallet today at the price a bank or a broker quotes, against keeping it
 * to maturity. Opened from the bond card's header; the price is not saved.
 */
export default function SaleScreen() {
  const { isin } = useLocalSearchParams<{ isin: string }>();
  const { control, salePrice, bond, position, today, assessment } = useSaleForm(isin);

  if (!bond || !assessment) {
    return (
      <EmptyState
        icon="cash-outline"
        title="Продаж не порахувати"
        message={
          !bond
            ? 'Цієї ОВДП немає в даних НБУ.'
            : !position ||
                position.purchases.every((purchase) => isPlannedPurchase(purchase, today))
              ? 'У плані немає зроблених купівель цієї ОВДП.'
              : bond.maturityDate <= today
                ? 'День погашення ОВДП уже настав, тому продаж не розраховується.'
                : 'НБУ ще не опублікував погашення цієї ОВДП.'
        }
      />
    );
  }

  const { currency } = bond;
  const { verdict, hints, quantity, holdResult, sale } = assessment;

  return (
    <FormScrollView>
      <Section
        title="Продаж сьогодні"
        footer="Ціни продажу немає в даних НБУ: вкажіть, скільки банк чи брокер заплатить за 1 шт сьогодні, за мінусом комісії."
      >
        <InfoRow label="ISIN" value={bond.isin} />
        <InfoRow label="Кількість" value={`${quantity} шт`} />
        <Controller
          control={control}
          name="price"
          render={({ field, fieldState }) => (
            <FieldRow label={`Ціна 1 шт, ${currency}`} error={fieldState.error?.message}>
              <Input
                variant="inline"
                type="decimal"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="0,00"
                autoFocus
                style={styles.inlineInput}
              />
            </FieldRow>
          )}
        />
      </Section>

      <SalePricesSection assessment={assessment} currency={currency} />

      {salePrice !== null && (
        <HintsSection title="Тримати чи продати" hints={hints} verdict={verdict} />
      )}

      {sale && (
        <Section
          title="Що дасть продаж"
          footer="Результат тримання більший, бо гроші працюють довше: вирішує дохідність від сьогодні."
        >
          <InfoRow label="Отримаєте за продаж" value={formatMoney(sale.proceeds, currency)} />
          <InfoRow
            label="Якщо продати сьогодні"
            value={formatMoney(sale.saleResult, currency)}
            signedValue={sale.saleResult}
          />
          <InfoRow
            label={`Якщо тримати до ${formatDate(bond.maturityDate)}`}
            value={formatMoney(holdResult, currency)}
            signedValue={holdResult}
          />
          <InfoRow
            label="Дохідність від сьогодні"
            value={
              sale.holdYield === null
                ? `нижче ${formatRateNumber(ANNUAL_YIELD_RANGE.lowest)}%`
                : `${formatRateNumber(sale.holdYield)}%`
            }
            hint="Скільки річних заробляють у цій ОВДП до погашення гроші, які за неї дають сьогодні"
          />
        </Section>
      )}
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  inlineInput: { minWidth: 120 },
});
