import { useToastStore } from './store';
import type { Toast } from './types';

export function useToast(): Toast | null {
  return useToastStore((state) => state.toast);
}
