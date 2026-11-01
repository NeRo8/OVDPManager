import { type Hint, sortHints, worstTone } from '../hints';

describe('hint priority', () => {
  it('orders by severity, drops empty hints and keeps equal priorities in order', () => {
    const hints: (Hint | null)[] = [
      { tone: 'warning', text: 'first warning' },
      { tone: 'info', text: 'information' },
      null,
      { tone: 'error', text: 'error' },
      { tone: 'warning', text: 'second warning' },
      { tone: 'success', text: 'success' },
    ];
    expect(sortHints(hints).map(({ text }) => text)).toEqual([
      'error',
      'first warning',
      'second warning',
      'success',
      'information',
    ]);
  });

  it('chooses the most severe tone, or info without hints', () => {
    expect(worstTone([])).toBe('info');
    expect(
      worstTone([
        { tone: 'success', text: 'ok' },
        { tone: 'warning', text: 'check' },
      ]),
    ).toBe('warning');
    expect(
      worstTone([
        { tone: 'error', text: 'loss' },
        { tone: 'info', text: 'note' },
      ]),
    ).toBe('error');
  });
});
