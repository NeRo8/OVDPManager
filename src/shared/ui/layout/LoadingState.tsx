import { ActivityIndicator, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { StateMessage } from './StateMessage';

export type LoadingStateProps = {
  message?: string;
};

/** Full-screen spinner while the screen's data is on its way. */
export function LoadingState({ message }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator />
      {message && <StateMessage text={message} />}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
    backgroundColor: theme.background,
  },
}));
