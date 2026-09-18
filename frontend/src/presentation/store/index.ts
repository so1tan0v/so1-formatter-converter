/**
 * Imports from packages
 */
import { configureStore } from '@reduxjs/toolkit';

/**
 * Imports from presentation
 */
import { workspaceReducer } from '@presentation/store/workspace.slice';

/**
 * Redux-хранилище приложения
 */
export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
