/**
 * Imports from packages
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface WorkspaceState {
  source: string;
  output: string;
  error: string | null;
}

const initialState: WorkspaceState = {
  source: '',
  output: '',
  error: null,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    /**
     * Сохраняет исходный текст в состоянии рабочей области
     *
     * @param state Текущее состояние рабочей области
     * @param action Действие с новым исходным текстом
     */
    setSource(state, action: PayloadAction<string>) {
      state.source = action.payload;
    },
    /**
     * Сохраняет успешный результат форматирования или преобразования
     *
     * @param state Текущее состояние рабочей области
     * @param action Действие с текстом результата
     */
    setOutput(state, action: PayloadAction<string>) {
      state.output = action.payload;
      state.error = null;
    },
    /**
     * Сохраняет ошибку и очищает предыдущий результат
     *
     * @param state Текущее состояние рабочей области
     * @param action Действие с текстом ошибки
     */
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.output = '';
    },
    /**
     * Очищает результат и ошибку, не трогая исходный текст
     *
     * @param state Текущее состояние рабочей области
     */
    clearResult(state) {
      state.output = '';
      state.error = null;
    },
  },
});

/**
 * Действие: сохранить исходный текст
 */
export const setSource = workspaceSlice.actions.setSource;

/**
 * Действие: сохранить успешный результат
 */
export const setOutput = workspaceSlice.actions.setOutput;

/**
 * Действие: сохранить ошибку
 */
export const setError = workspaceSlice.actions.setError;

/**
 * Действие: очистить результат и ошибку
 */
export const clearResult = workspaceSlice.actions.clearResult;

/**
 * Редьюсер состояния рабочей области
 */
export const workspaceReducer = workspaceSlice.reducer;
