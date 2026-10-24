import { StyleSheet } from 'react-native-unistyles';

import { Typography } from '../typography/Typography';

type Props = {
  text: string;
};

export function StateMessage({ text }: Props) {
  return (
    <Typography variant="subhead" tone="secondary" align="center" style={styles.message}>
      {text}
    </Typography>
  );
}

const styles = StyleSheet.create({
  message: { lineHeight: 21, maxWidth: 400 },
});
