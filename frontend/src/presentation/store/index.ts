import { configureStore } from '@reduxjs/toolkit';

import { workspaceReducer } from '@presentation/store/workspace.slice';

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
