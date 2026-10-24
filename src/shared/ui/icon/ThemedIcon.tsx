import { Ionicons, type IoniconsIconName } from '@react-native-vector-icons/ionicons/static';
import { withUnistyles } from 'react-native-unistyles';

export type IconName = IoniconsIconName;

/**
 * An Ionicons glyph whose color follows the theme (`uniProps={(theme) => ({ color: … })}`). The
 * static import uses the font embedded by the package's config plugin, so it draws on first render.
 */
export const ThemedIcon = withUnistyles(Ionicons);
