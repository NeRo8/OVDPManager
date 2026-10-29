import { useEffect } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { hideToast, useToast } from '@/shared/lib';

import { ToastView } from './ToastView';

const VISIBLE_MS = 4000;
/** Longer when there is something to press, so the action can still be reached. */
const VISIBLE_WITH_ACTION_MS = 6000;

/**
 * Shows the current toast over every screen, under the status bar. Render it once, after the
 * root navigator. The host stays mounted so a toast can play its exit animation.
 */
export function ToastHost() {
  const toast = useToast();

  useEffect(() => {
    if (!toast) return;
    AccessibilityInfo.announceForAccessibility(
      [toast.title, toast.message].filter(Boolean).join('. '),
    );
    const timer = setTimeout(
      () => hideToast(toast.id),
      toast.action ? VISIBLE_WITH_ACTION_MS : VISIBLE_MS,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <View style={styles.host} pointerEvents="box-none">
      {toast && <ToastView key={toast.id} toast={toast} />}
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  host: {
    position: 'absolute',
    top: rt.insets.top + theme.space.sm,
    left: theme.space.lg + rt.insets.left,
    right: theme.space.lg + rt.insets.right,
    alignItems: 'stretch',
  },
}));
