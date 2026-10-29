import { Typography, type TypographyTone } from '../typography/Typography';

import { ListRow } from './ListRow';

export type ActionRowProps = {
  title: string;
  onPress: () => void;
  /** `danger` for an action that removes data */
  tone?: Extract<TypographyTone, 'accent' | 'danger'>;
  disabled?: boolean;
};

/** A section row that does something in place, unlike LinkRow, which opens another screen. */
export function ActionRow({ title, onPress, tone = 'accent', disabled }: ActionRowProps) {
  return (
    <ListRow
      title={
        <Typography variant="body" tone={tone}>
          {title}
        </Typography>
      }
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    />
  );
}
