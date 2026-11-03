import { Controller } from 'react-hook-form';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from '@/components/button/Button';
import { DateField } from '@/components/form/DateField';
import { FieldRow } from '@/components/form/FieldRow';
import { Input } from '@/components/form/Input';
import { FormScrollView } from '@/components/layout/FormScrollView';
import { InfoRow } from '@/components/layout/InfoRow';
import { Section } from '@/components/layout/Section';
import { Money } from '@/components/typography/Money';
import type { Bond } from '@/lib/portfolio/portfolio';

import { HintsSection } from './HintsSection';
import { SaleComparisonSection } from './SaleComparisonSection';
import { SalePricesSection } from './SalePricesSection';
import { useSaleForm } from './useSaleForm.hook';

type Props = { bond: Bond; operationId?: string };

export function SaleForm({ bond, operationId }: Props) {
  const { control, isValid, submit, price, available, assessment } = useSaleForm(bond, operationId);
  return (
    <FormScrollView>
      <Section
        title="Продаж"
        footer="Вкажіть повну суму, отриману після комісій. Попередні купівлі й виплати залишаться в історії. Купон у день продажу належить продавцю."
      >
        <InfoRow label="ISIN" value={bond.isin} />
        <InfoRow label="Доступно на дату" value={`${available} шт`} />
        <Controller
          control={control}
          name="date"
          render={({ field, fieldState }) => (
            <FieldRow label="Дата продажу" error={fieldState.error?.message}>
              <DateField value={field.value} onChange={field.onChange} />
            </FieldRow>
          )}
        />
        <Controller
          control={control}
          name="quantity"
          render={({ field, fieldState }) => (
            <FieldRow label="Кількість, шт" error={fieldState.error?.message}>
              <Input
                variant="inline"
                type="integer"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="0"
                style={styles.input}
              />
            </FieldRow>
          )}
        />
        <Controller
          control={control}
          name="amount"
          render={({ field, fieldState }) => (
            <FieldRow label={`Отримано, ${bond.currency}`} error={fieldState.error?.message}>
              <Input
                variant="inline"
                type="decimal"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="0,00"
                style={styles.input}
              />
            </FieldRow>
          )}
        />
        <InfoRow label="Ціна 1 шт" value={<Money value={price} currency={bond.currency} />} />
      </Section>
      {assessment && <SalePricesSection assessment={assessment} currency={bond.currency} />}
      {assessment && price !== null && (
        <HintsSection
          title="Тримати чи продати"
          hints={assessment.hints}
          verdict={assessment.verdict}
        />
      )}
      {assessment && <SaleComparisonSection bond={bond} assessment={assessment} />}
      <Button title="Зберегти продаж" disabled={!isValid} onPress={() => void submit()} />
    </FormScrollView>
  );
}

const styles = StyleSheet.create({ input: { minWidth: 120 } });
