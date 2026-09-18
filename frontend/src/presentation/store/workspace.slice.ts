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
    setSource(state, action: PayloadAction<string>) {
      state.source = action.payload;
    },
    setOutput(state, action: PayloadAction<string>) {
      state.output = action.payload;
      state.error = null;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.output = '';
    },
    clearResult(state) {
      state.output = '';
      state.error = null;
    },
  },
});

export const { setSource, setOutput, setError, clearResult } =
  workspaceSlice.actions;

export const workspaceReducer = workspaceSlice.reducer;
