import { Controller } from 'react-hook-form';
import { StyleSheet } from 'react-native-unistyles';

import { type Bond } from '@/entities/portfolio';
import { useAddPurchaseForm } from '@/features/add-purchase';
import { formatDate, formatMoney } from '@/shared/lib';
import {
  Button,
  DateField,
  FieldRow,
  InfoRow,
  Input,
  FormScrollView,
  Section,
  Separator,
  Typography,
} from '@/shared/ui';
import { PurchaseHints } from './PurchaseHints';

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

      {preview && <PurchaseHints hints={preview.hints} verdict={preview.verdict} />}

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
          <Separator />
          <InfoRow label="Купонів попереду" value={String(preview.couponsLeft)} />
          <Separator />
          <InfoRow label="Усього виплат" value={formatMoney(preview.totalPayments, currency)} />
          <Separator />
          {preview.netIncome !== null ? (
            <>
              <InfoRow
                label="Чистий дохід"
                value={
                  <Typography
                    variant="subhead"
                    weight="medium"
                    tone={preview.netIncome < 0 ? 'danger' : 'primary'}
                  >
                    {formatMoney(preview.netIncome, currency)}
                  </Typography>
                }
              />
              <Separator />
              <InfoRow
                label="Дохідність за весь строк"
                hint="Чистий дохід у відсотках від суми купівлі"
                value={preview.returnPercent === null ? '—' : `${preview.returnPercent}%`}
              />
              <Separator />
              <InfoRow
                label="Річна дохідність"
                hint={`Ваша ціна й кожна виплата до погашення ${formatDate(bond.maturityDate)} у свій день, перераховані на рік. Її можна порівнювати з депозитом`}
                value={preview.annualYield === null ? '—' : `${preview.annualYield}%`}
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
