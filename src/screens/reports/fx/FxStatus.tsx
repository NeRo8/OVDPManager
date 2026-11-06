import { EmptyState } from '@/components/layout/EmptyState';
import { Typography } from '@/components/typography/Typography';

type Props = { loading: boolean; failed: boolean; empty: boolean };

export function FxStatus({ loading, failed, empty }: Props) {
  return (
    <>
      {loading && (
        <Typography variant="subhead" tone="secondary">
          Завантажуємо курси НБУ…
        </Typography>
      )}
      {failed && (
        <EmptyState
          layout="inline"
          icon="cloud-offline-outline"
          title="Не вдалося завантажити курси"
          message="Перевірте з’єднання та відкрийте звіт ще раз."
        />
      )}
      {empty && (
        <EmptyState
          layout="inline"
          icon="bar-chart-outline"
          title="Даних немає"
          message="Немає підтверджених гривневих операцій або виплат за обраний період."
        />
      )}
    </>
  );
}
