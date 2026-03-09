import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';

export interface AppToast {
  message: string;
  type: 'success' | 'error';
}

interface LenderState {
  email: string;
  showWelcome: boolean;
  toast: AppToast | null;
}

const initialState: LenderState = {
  email: localStorage.getItem('lenderEmail') ?? '',
  showWelcome: false,
  toast: null,
};

const lenderSlice = createSlice({
  name: 'lender',
  initialState,
  reducers: {
    setEmail(state, action: PayloadAction<string>) {
      state.email = action.payload;
      state.showWelcome = true;
      localStorage.setItem('lenderEmail', action.payload);
    },
    clearEmail(state) {
      state.email = '';
      state.showWelcome = false;
      localStorage.removeItem('lenderEmail');
    },
    dismissWelcome(state) {
      state.showWelcome = false;
    },
    showToast(state, action: PayloadAction<AppToast>) {
      state.toast = action.payload;
    },
    dismissToast(state) {
      state.toast = null;
    },
  },
});

export const { setEmail, clearEmail, dismissWelcome, showToast, dismissToast } =
  lenderSlice.actions;

export const selectLenderEmail = (state: RootState) => state.lender.email;
export const selectShowWelcome = (state: RootState) => state.lender.showWelcome;
export const selectToast = (state: RootState) => state.lender.toast;

export default lenderSlice.reducer;
