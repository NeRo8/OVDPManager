/**
 * How a hint reads: `success` all is well; `info` worth knowing, nothing wrong; `warning` look
 * before acting; `error` a loss or a poor choice.
 */
export type HintTone = 'success' | 'info' | 'warning' | 'error';

/** One reason in plain words, colored by how much it needs attention. */
export type Hint = { tone: HintTone; text: string };

/** What the hints mean as a whole, for the banner above them. */
export type Verdict = { tone: Exclude<HintTone, 'info'>; title: string };

const SEVERITY = { info: 0, success: 1, warning: 2, error: 3 } as const satisfies Record<
  HintTone,
  number
>;

/** The hints there are, the most serious first; equal ones keep their order. */
export function sortHints(hints: (Hint | null)[]): Hint[] {
  return hints
    .filter((hint): hint is Hint => hint !== null)
    .sort((a, b) => SEVERITY[b.tone] - SEVERITY[a.tone]);
}

/** The worst tone among the hints; `info` when they are all neutral or there are none. */
export function worstTone(hints: Hint[]): HintTone {
  return hints.reduce<HintTone>(
    (current, hint) => (SEVERITY[hint.tone] > SEVERITY[current] ? hint.tone : current),
    'info',
  );
}
