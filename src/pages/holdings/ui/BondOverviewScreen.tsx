import { StyleSheet } from 'react-native-unistyles';

import { BondParameters } from '@/entities/portfolio';
import { formatMoney, round2 } from '@/shared/lib';
import {
  Button,
  FAB_CLEARANCE,
  InfoRow,
  ScreenScrollView,
  Section,
  Separator,
  Typography,
} from '@/shared/ui';
import { useBondIsin } from '../model/useBondIsin.hook';
import { useBondDetails } from '../model/useBondDetails.hook';

/** The issue's terms, then what the position has cost and earned. */
export default function BondOverviewScreen() {
  const isin = useBondIsin();
  const {
    position,
    bond,
    currency,
    hasTopUps,
    received,
    expected,
    profit,
    canTopUp,
    deletePosition,
  } = useBondDetails(isin);

  if (!position) return null;

  return (
    <ScreenScrollView contentContainerStyle={canTopUp && styles.withFab}>
      {bond ? (
        <BondParameters bond={bond} />
      ) : (
        <Typography variant="subhead" align="center" tone="danger">
          Цієї ОВДП немає в даних НБУ — параметри випуску й графік виплат недоступні.
        </Typography>
      )}

      <Section title="Підсумок">
        <InfoRow label="Кількість" value={`${position.quantity} шт`} />
        <Separator />
        <InfoRow label="Вкладено" value={formatMoney(position.amount, currency)} />
        {hasTopUps && (
          <>
            <Separator />
            <InfoRow
              label="Середня ціна 1 шт"
              value={formatMoney(round2(position.amount / position.quantity), currency)}
            />
          </>
        )}
        {bond && (
          <>
            <Separator />
            <InfoRow label="Отримано" value={formatMoney(received, currency)} />
            <Separator />
            <InfoRow label="Очікується" value={formatMoney(expected, currency)} />
            <Separator />
            <InfoRow
              label="Чистий дохід"
              value={
                <Typography
                  variant="subhead"
                  weight="semibold"
                  tone={profit >= 0 ? 'positive' : 'danger'}
                >
                  {formatMoney(profit, currency)}
                </Typography>
              }
            />
          </>
        )}
      </Section>

      <Button title="Видалити з гаманця" variant="destructive" onPress={deletePosition} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  withFab: { paddingBottom: FAB_CLEARANCE },
});
