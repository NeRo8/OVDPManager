import { Fragment } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { PurchaseHint, PurchaseHintTone, PurchaseVerdict } from '@/features/add-purchase';
import { type IconName, Section, Separator, ThemedIcon, Typography } from '@/shared/ui';

const ICONS = {
  success: 'checkmark-circle',
  info: 'information-circle',
  warning: 'warning',
  error: 'close-circle',
} as const satisfies Record<PurchaseHintTone, IconName>;

const TEXT_TONES = {
  success: 'success',
  warning: 'warning',
  error: 'danger',
} as const satisfies Record<PurchaseVerdict['tone'], string>;

type Props = {
  hints: PurchaseHint[];
  verdict: PurchaseVerdict | null;
};

/**
 * How good the purchase is, colored by how much it needs attention: a banner with the overall
 * verdict, then each reason with its own colored mark.
 */
export function PurchaseHints({ hints, verdict }: Props) {
  styles.useVariants({ verdict: verdict?.tone });
  if (hints.length === 0) return null;
  return (
    <Section
      title="Наскільки це вигідно"
      footer="Розрахунок — якщо тримати ОВДП до погашення. Облікова ставка НБУ — на дату купівлі (для запланованої покупки — поточна). Інші ОВДП порівнюються за ставкою купону, без їхньої ринкової ціни."
    >
      {verdict && (
        <View style={styles.banner} accessibilityRole="summary">
          <ThemedIcon
            name={ICONS[verdict.tone]}
            size={24}
            uniProps={(theme) => ({ color: toneColor(theme, verdict.tone) })}
          />
          <Typography variant="headline" tone={TEXT_TONES[verdict.tone]} style={styles.text}>
            {verdict.title}
          </Typography>
        </View>
      )}
      {hints.map((hint, index) => (
        <Fragment key={hint.text}>
          {(index > 0 || verdict) && <Separator />}
          <View style={styles.hint}>
            <ThemedIcon
              name={ICONS[hint.tone]}
              size={20}
              uniProps={(theme) => ({ color: toneColor(theme, hint.tone) })}
            />
            <Typography variant="subhead" style={styles.text}>
              {hint.text}
            </Typography>
          </View>
        </Fragment>
      ))}
    </Section>
  );
}

function toneColor(
  theme: { success: string; warning: string; danger: string; secondaryText: string },
  tone: PurchaseHintTone,
): string {
  return {
    success: theme.success,
    info: theme.secondaryText,
    warning: theme.warning,
    error: theme.danger,
  }[tone];
}

const styles = StyleSheet.create((theme) => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    variants: {
      verdict: {
        success: { backgroundColor: theme.successSurface },
        warning: { backgroundColor: theme.warningSurface },
        error: { backgroundColor: theme.dangerSurface },
      },
    },
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  text: { flex: 1, lineHeight: 21 },
}));
