import { StyleSheet } from 'react-native-unistyles';

import type { PositionPayment } from '@/entities/portfolio';
import { formatDate, formatMoney } from '@/shared/lib';
import { Typography } from '@/shared/ui';

type Props = {
  nextPayment?: PositionPayment;
  hasBond: boolean;
};

export function NextPaymentLine({ nextPayment, hasBond }: Props) {
  if (!hasBond) {
    return (
      <Typography variant="caption1" tone="danger">
        Не знайдено в реєстрі НБУ
      </Typography>
    );
  }
  if (!nextPayment) {
    return (
      <Typography variant="caption1" tone="secondary">
        Погашено
      </Typography>
    );
  }
  return (
    <Typography variant="subhead" style={styles.nextLine}>
      Далі: {formatDate(nextPayment.date)} —{' '}
      <Typography variant="subhead" tone="positive">
        {formatMoney(nextPayment.total, nextPayment.currency)}
      </Typography>
    </Typography>
  );
}

const styles = StyleSheet.create((theme) => ({
  nextLine: { marginTop: theme.space.xxs },
}));
