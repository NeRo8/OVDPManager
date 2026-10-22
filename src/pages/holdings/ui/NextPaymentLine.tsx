import { StyleSheet } from 'react-native-unistyles';

import type { PositionPayment } from '@/entities/portfolio';
import { formatDate, formatMoney } from '@/shared/lib';
import { Typography } from '@/shared/ui';

type Props = {
  next?: PositionPayment;
  hasBond: boolean;
};

export function NextPaymentLine({ next, hasBond }: Props) {
  if (!hasBond) {
    return (
      <Typography variant="caption1" tone="danger">
        Не знайдено в реєстрі НБУ
      </Typography>
    );
  }
  if (!next) {
    return (
      <Typography variant="caption1" tone="secondary">
        Погашено
      </Typography>
    );
  }
  return (
    <Typography variant="subhead" style={styles.nextLine}>
      Далі: {formatDate(next.date)} —{' '}
      <Typography variant="subhead" tone="positive">
        {formatMoney(next.total, next.currency)}
      </Typography>
    </Typography>
  );
}

const styles = StyleSheet.create({
  nextLine: { marginTop: 2 },
});
