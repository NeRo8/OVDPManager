import { Controller } from 'react-hook-form';
import { StyleSheet } from 'react-native-unistyles';

import { BondParameters, type Bond } from '@/entities/portfolio';
import { useAddPurchaseForm } from '@/features/add-purchase';
import { formatDate, formatMoney } from '@/shared/lib';
import {
  Button,
  DateField,
  FieldRow,
  InfoRow,
  Input,
  ScreenScrollView,
  Section,
  Separator,
} from '@/shared/ui';

type Props = {
  bond: Bond;
  /** Bonds of this ISIN already in the plan */
  ownedQuantity: number;
  onSaved: () => void;
};

/**
 * The purchase form for one bond: each field shows its own error once edited, and Save stays
 * disabled until the whole purchase is valid.
 */
export function AddPurchaseForm({ bond, ownedQuantity, onSaved }: Props) {
  const { control, isValid, submit, purchaseDate, pricePerBond, isPlanned, preview } =
    useAddPurchaseForm(bond, onSaved);
  const { currency } = bond;

  return (
    <ScreenScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
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
          isPlanned
            ? `Дата ще попереду: покупка буде в плані як запланована й почне приносити виплати після ${formatDate(purchaseDate)}.`
            : 'Сума — скільки списали за всю покупку, як у застосунку банку чи брокера; ціна 1 шт рахується з неї.'
        }
      >
        <Controller
          control={control}
          name="purchaseDate"
          render={({ field, fieldState }) => (
            <FieldRow label="Дата купівлі" error={fieldState.error?.message}>
              <DateField value={field.value} onChange={field.onChange} />
            </FieldRow>
          )}
        />
        <Separator />
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
                style={styles.inlineInput}
              />
            </FieldRow>
          )}
        />
        <Separator />
        <Controller
          control={control}
          name="amount"
          render={({ field, fieldState }) => (
            <FieldRow label={`Сума, ${currency}`} error={fieldState.error?.message}>
              <Input
                variant="inline"
                type="decimal"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="0,00"
                style={styles.inlineInput}
              />
            </FieldRow>
          )}
        />
        <Separator />
        <InfoRow
          label="Ціна 1 шт"
          value={pricePerBond === null ? '—' : formatMoney(pricePerBond, currency)}
        />
      </Section>

      {preview && (
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
          <Separator />
          <InfoRow label="Чистий дохід" value={formatMoney(preview.profit, currency)} />
        </Section>
      )}

      <Button title="Зберегти" disabled={!isValid} onPress={() => void submit()} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  inlineInput: { minWidth: 120 },
});
