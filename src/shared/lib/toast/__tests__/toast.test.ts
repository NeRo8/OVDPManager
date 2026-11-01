import { hideToast, showToast } from '../actions';
import { useToastStore } from '../store';

const current = () => useToastStore.getState().toast;

beforeEach(() => useToastStore.setState({ toast: null }));

describe('toast', () => {
  it('shows one toast at a time, a new one replacing the last under an id of its own', () => {
    showToast({ tone: 'success', title: 'Купівлю додано' });
    const first = current();
    showToast({ tone: 'success', title: 'Купівлю додано' });
    expect(current()).toEqual({ tone: 'success', title: 'Купівлю додано', id: expect.any(Number) });
    expect(current()?.id).not.toBe(first?.id);
  });

  it('hides only the toast still on screen, so a late timer leaves a newer one', () => {
    showToast({ tone: 'info', title: 'Перший' });
    const firstId = current()?.id ?? 0;
    showToast({ tone: 'info', title: 'Другий' });
    hideToast(firstId);
    expect(current()?.title).toBe('Другий');
    hideToast(current()?.id ?? 0);
    expect(current()).toBeNull();
  });
});
