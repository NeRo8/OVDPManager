import { BlurMask, Canvas, Group } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { withAlpha } from '@/shared/lib';
import { AURORA_BLOBS } from '../model/aurora';
import { AuroraBlob } from './AuroraBlob';

/** Soft on the light background; the slides' text is primary, so it keeps its contrast on top */
const BLOB_OPACITY = 0.28;

type Props = {
  /** The pager's scroll position in pages */
  position: SharedValue<number>;
  accent: string;
  coupon: string;
  redemption: string;
};

/** Blurred patches of the app's colors drifting behind the slides (Skia). */
export function OnboardingBackdrop({ position, accent, coupon, redemption }: Props) {
  const { width, height } = useWindowDimensions();
  const colors = { accent, coupon, redemption };

  return (
    <Canvas style={styles.canvas}>
      <Group>
        <BlurMask blur={width * 0.18} style="normal" />
        {(Object.keys(AURORA_BLOBS) as (keyof typeof AURORA_BLOBS)[]).map((name) => (
          <AuroraBlob
            key={name}
            blob={AURORA_BLOBS[name]}
            color={withAlpha(colors[name], BLOB_OPACITY)}
            width={width}
            height={height}
            position={position}
          />
        ))}
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: StyleSheet.absoluteFillObject,
});
