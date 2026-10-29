import { Controller } from 'react-hook-form';
import { StyleSheet } from 'react-native-unistyles';

import { useAddPurchaseForm } from '@/features/add-purchase';

import { type Bond } from '@/entities/portfolio';

import { formatDate, formatMoney } from '@/shared/lib';
import {
  Button,
  DateField,
  FieldRow,
  InfoRow,
  Input,
  FormScrollView,
  Section,
  SignedValue,
} from '@/shared/ui';

import { HintsSection } from './HintsSection';

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
  const save = () => void submit();

  return (
    <FormScrollView>
      <Section
        title="ОВДП"
        footer={
          ownedQuantity > 0
            ? `У гаманці вже є ${ownedQuantity} шт — ця купівля додасться до них.`
            : undefined
        }
      >
        <InfoRow label="ISIN" value={bond.isin} />
      </Section>

      <Section
        title={isPlanned ? 'Запланована купівля' : 'Купівля'}
        footer={
          isPlanned
            ? `Дата ще попереду: купівля буде в плані як запланована й почне приносити виплати після ${formatDate(purchaseDate)}.`
            : 'Сума — скільки списали за всю купівлю, як у застосунку банку чи брокера; ціна 1 шт рахується з неї.'
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
        <InfoRow
          label="Ціна 1 шт"
          value={pricePerBond === null ? '—' : formatMoney(pricePerBond, currency)}
        />
      </Section>

      {preview && (
        <HintsSection
          title="Наскільки це вигідно"
          footer="Оцінка — за річною дохідністю, якщо тримати ОВДП до погашення. Облікова ставка НБУ — на дату купівлі (для запланованої купівлі — поточна). Нові ОВДП — розміщені за 12 місяців до купівлі: ставка купону нової ОВДП близька до ринкової дохідності на день розміщення."
          hints={preview.hints}
          verdict={preview.verdict}
        />
      )}

      {preview && (
        <Section title={ownedQuantity > 0 ? 'Що дасть ця купівля' : 'Що ви отримаєте'}>
          <InfoRow
            label="Наступна виплата"
            value={
              preview.nextPayment
                ? `${formatDate(preview.nextPayment.date)} · ${formatMoney(preview.nextPayment.total, currency)}`
                : '—'
            }
          />
          <InfoRow label="Купонів попереду" value={String(preview.couponsLeft)} />
          <InfoRow label="Усього виплат" value={formatMoney(preview.totalPayments, currency)} />
          {preview.netIncome !== null ? (
            <>
              <InfoRow
                label="Чистий дохід"
                value={
                  <SignedValue value={preview.netIncome} variant="subhead" weight="medium">
                    {formatMoney(preview.netIncome, currency)}
                  </SignedValue>
                }
              />
              <InfoRow
                label="Дохідність за весь строк"
                hint="Чистий дохід у відсотках від суми купівлі"
                value={preview.returnPercent === null ? '—' : `${preview.returnPercent}%`}
              />
              <InfoRow
                label="Річна дохідність"
                hint={`Ваша ціна й кожна виплата до погашення ${formatDate(bond.maturityDate)} у свій день, перераховані на рік. Її можна порівнювати з депозитом`}
                value={preview.annualYield}
              />
            </>
          ) : (
            <InfoRow
              label="Чистий дохід"
              hint="НБУ ще не опублікував погашення цієї ОВДП, тому виплати неповні"
              value="Немає повних даних НБУ"
            />
          )}
        </Section>
      )}

      <Button title="Зберегти" disabled={!isValid} onPress={save} />
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  inlineInput: { minWidth: 120 },
});
