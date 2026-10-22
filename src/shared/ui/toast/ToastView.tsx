import { Pressable, View } from 'react-native';
import Animated, { Easing, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { hideToast, type Toast, type ToastTone } from '@/shared/lib';
import { type IconName, ThemedIcon } from '../icon/ThemedIcon';
import { Typography } from '../typography/Typography';

// Entering and leaving the screen: a strong ease-out, so it responds at once and settles softly.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

const TONE_ICONS = {
  error: 'alert-circle',
  success: 'checkmark-circle',
  info: 'information-circle',
} as const satisfies Record<ToastTone, IconName>;

type Props = {
  toast: Toast;
};

/** One toast: drops in from the top, and a tap anywhere but its action dismisses it. */
export function ToastView({ toast }: Props) {
  styles.useVariants({ tone: toast.tone });
  const { action } = toast;

  return (
    <Animated.View
      entering={FadeInUp.duration(250).easing(EASE_OUT)}
      exiting={FadeOutUp.duration(200).easing(EASE_OUT)}
      style={styles.toast}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Pressable
        onPress={() => hideToast(toast.id)}
        accessibilityRole="button"
        accessibilityLabel={[toast.title, toast.message].filter(Boolean).join('. ')}
        accessibilityHint="Закрити повідомлення"
        style={styles.body}
      >
        <ThemedIcon
          name={TONE_ICONS[toast.tone]}
          size={24}
          uniProps={(theme) => ({
            color:
              toast.tone === 'error'
                ? theme.danger
                : toast.tone === 'success'
                  ? theme.positive
                  : theme.accent,
          })}
        />
        <View style={styles.text}>
          <Typography variant="subhead" weight="semibold">
            {toast.title}
          </Typography>
          {toast.message && (
            <Typography variant="footnote" tone="secondary">
              {toast.message}
            </Typography>
          )}
        </View>
      </Pressable>
      {action && (
        <Pressable
          onPress={() => {
            hideToast(toast.id);
            action.onPress();
          }}
          hitSlop={8}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Typography variant="subhead" weight="semibold" tone="accent">
            {action.label}
          </Typography>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  toast: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    paddingRight: theme.space.md,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    backgroundColor: theme.raised,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: theme.shadowOverlay,
    variants: {
      tone: {
        error: { borderColor: theme.danger },
        success: { borderColor: theme.border },
        info: { borderColor: theme.border },
      },
    },
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingVertical: theme.space.md,
    paddingLeft: theme.space.lg,
  },
  text: { flex: 1, gap: theme.space.xxs },
  action: { paddingVertical: theme.space.sm, paddingHorizontal: theme.space.xs },
  pressed: { opacity: 0.6 },
}));
