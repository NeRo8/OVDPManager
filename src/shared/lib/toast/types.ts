export type ToastTone = 'error' | 'success' | 'info';

export type Toast = {
  /** New for every toast, so a repeated message still restarts its timer and animation. */
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
};

export type ToastState = {
  /** One toast at a time: a new one replaces the one on screen */
  toast: Toast | null;
};
