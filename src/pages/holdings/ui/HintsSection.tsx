import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { Hint, HintTone, Verdict } from '@/entities/portfolio';
import { type IconName, Section, ThemedIcon, Typography } from '@/shared/ui';

const ICONS = {
  success: 'checkmark-circle',
  info: 'information-circle',
  warning: 'warning',
  error: 'close-circle',
} as const satisfies Record<HintTone, IconName>;

const TEXT_TONES = {
  success: 'success',
  warning: 'warning',
  error: 'danger',
} as const satisfies Record<Verdict['tone'], string>;

type Props = {
  title: string;
  footer?: string;
  hints: Hint[];
  verdict: Verdict | null;
};

/**
 * An assessment colored by how much it needs attention: a banner with the overall verdict, then
 * each reason with its own colored mark.
 */
export function HintsSection({ title, footer, hints, verdict }: Props) {
  styles.useVariants({ verdict: verdict?.tone });
  if (hints.length === 0) return null;
  return (
    <Section title={title} footer={footer}>
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
      {hints.map((hint) => (
        <View key={hint.text} style={styles.hint}>
          <ThemedIcon
            name={ICONS[hint.tone]}
            size={20}
            uniProps={(theme) => ({ color: toneColor(theme, hint.tone) })}
          />
          <Typography variant="subhead" style={styles.text}>
            {hint.text}
          </Typography>
        </View>
      ))}
    </Section>
  );
}

function toneColor(
  theme: { success: string; warning: string; danger: string; secondaryText: string },
  tone: HintTone,
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
