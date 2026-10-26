import { Typography, type TypographyProps } from './Typography';

type Props = Omit<TypographyProps, 'tone'> & {
  /** The numeric value determines the color; children contain its displayed form. */
  value: number;
};

/** Signed values are green above zero, red below zero, and neutral at zero. */
export function SignedValue({ value, ...props }: Props) {
  const tone = value > 0 ? 'success' : value < 0 ? 'danger' : 'primary';
  return <Typography {...props} tone={tone} />;
}
