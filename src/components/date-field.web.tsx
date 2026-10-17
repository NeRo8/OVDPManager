import { useColorScheme } from '@/hooks/use-color-scheme';
import { useColors } from '@/theme/colors';

type Props = {
  value: string;
  onChange: (isoDate: string) => void;
  maximumDate?: string;
};

// The @expo/ui date picker renders nothing on web, so web uses the browser's own date input.
export function DateField({ value, onChange, maximumDate }: Props) {
  const colors = useColors();
  const scheme = useColorScheme();
  return (
    <input
      type="date"
      value={value}
      max={maximumDate}
      onChange={(event) => {
        if (event.target.value) onChange(event.target.value);
      }}
      style={{
        fontSize: 17,
        padding: '6px 10px',
        border: 'none',
        borderRadius: 8,
        background: colors.muted,
        color: colors.text,
        // RN-web sets fonts per element, so a raw input doesn't inherit them.
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontVariantNumeric: 'tabular-nums',
        colorScheme: scheme === 'dark' ? 'dark' : 'light',
      }}
    />
  );
}
