import { create } from 'zustand';

import type { ToastState } from './types';

export const initialState: ToastState = { toast: null };

/** The toast on screen. Not persisted: a toast does not outlive the session. */
export const useToastStore = create<ToastState>()(() => initialState);
