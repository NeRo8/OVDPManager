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

/**
 * Records a sale, or changes one. A sale dated ahead is planned; once its date has come it asks
 * whether it took place: saving confirms it, «Продаж не відбувся» removes it.
 */
export function SaleForm({ bond, operationId }: Props) {
  const { control, isValid, submit, price, available, assessment, awaiting, cancel, isPlanned } =
    useSaleForm(bond, operationId);
  const save = () => void submit();
  const saveTitle = awaiting && !isPlanned ? 'Продаж відбувся' : 'Зберегти продаж';
  return (
    <FormScrollView>
      <Section
        title="Продаж"
        footer="Вкажіть повну суму, отриману після комісій. Попередні купівлі й виплати залишаться в історії. Купон у день продажу належить продавцю. Продаж з майбутньою датою — запланований, доки ви його не підтвердите."
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
      <Button title={saveTitle} disabled={!isValid} onPress={save} />
      {awaiting && <Button title="Продаж не відбувся" variant="secondary" onPress={cancel} />}
    </FormScrollView>
  );
}

const styles = StyleSheet.create({ input: { minWidth: 120 } });
