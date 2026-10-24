import { GlassView } from 'expo-glass-effect';
import { withUnistyles } from 'react-native-unistyles';

/**
 * Liquid Glass in the app's theme, which may differ from the system one. A tint goes through
 * `uniProps={(theme) => ({ tintColor: … })}`. Render it only where `hasLiquidGlass` is true and
 * give the other platforms a solid surface instead.
 */
export const ThemedGlassView = withUnistyles(GlassView, (_theme, rt) => ({
  colorScheme: rt.themeName,
}));
