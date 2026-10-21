import { useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { StyleSheet } from 'react-native-unistyles';

import { PaymentRow } from '@/entities/portfolio';
import { FAB_CLEARANCE, ScreenScrollView, Section, Separator, Typography } from '@/shared/ui';
import { useBondDetails } from '../model/useBondDetails.hook';

/** Every payment of the position, each counting only the bonds held on its date. */
export default function BondPaymentsScreen() {
  const { isin } = useLocalSearchParams<{ isin: string }>();
  const { bond, payments, hasTopUps, canTopUp } = useBondDetails(isin);

  return (
    <ScreenScrollView contentContainerStyle={canTopUp && styles.withFab}>
      {!bond ? (
        <Typography variant="subhead" align="center" tone="secondary" style={styles.empty}>
          Графік виплат недоступний без даних НБУ.
        </Typography>
      ) : (
        <Section
          footer={
            hasTopUps ? 'Кожна виплата враховує лише облігації, куплені до її дати.' : undefined
          }
        >
          {payments.length === 0 ? (
            <Typography variant="subhead" align="center" tone="secondary" style={styles.empty}>
              Після дати купівлі виплат немає
            </Typography>
          ) : (
            payments.map((payment, index) => (
              <Fragment key={`${payment.date}-${payment.type}`}>
                {index > 0 && <Separator />}
                <PaymentRow payment={payment} showQuantity={hasTopUps} />
              </Fragment>
            ))
          )}
        </Section>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  withFab: { paddingBottom: FAB_CLEARANCE },
  empty: { padding: 16 },
});
