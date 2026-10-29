import { ListRow } from '../layout/ListRow';
import { Section } from '../layout/Section';
import { SkeletonBlock } from './SkeletonBlock';

type Props = {
  rows: number;
};

/** A `Section` of list rows on their way: a badge, two lines of text and an amount each. */
export function SkeletonSection({ rows }: Props) {
  return (
    <Section>
      {Array.from({ length: rows }, (_, index) => (
        <ListRow
          key={index}
          leading={<SkeletonBlock width={36} height={36} shape="circle" />}
          title={<SkeletonBlock width="60%" height={14} />}
          subtitle={<SkeletonBlock width="35%" height={12} />}
          trailing={<SkeletonBlock width={64} height={14} />}
        />
      ))}
    </Section>
  );
}
