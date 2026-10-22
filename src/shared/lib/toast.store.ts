import { create } from 'zustand';

export type ToastTone = 'error' | 'success' | 'info';

export type Toast = {
  /** New for every toast, so a repeated message still restarts its timer and animation. */
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
};

const useToastStore = create<{ toast: Toast | null }>()(() => ({ toast: null }));

let lastId = 0;

/**
 * Tells the user about something that just happened (a failed request, a form that cannot be
 * saved, a finished action). One toast at a time: a new one replaces the one on screen.
 */
export function showToast(toast: Omit<Toast, 'id'>): void {
  lastId += 1;
  useToastStore.setState({ toast: { ...toast, id: lastId } });
}

/** Hides the toast if it is still the one on screen. */
export function hideToast(id: number): void {
  useToastStore.setState((state) => (state.toast?.id === id ? { toast: null } : state));
}

export function useToast(): Toast | null {
  return useToastStore((state) => state.toast);
}
