/**
 * The Redux store. Currently holds only auth; add reducers here as more
 * cross-cutting client state moves into Redux (server cache stays in SWR).
 *
 * Mounted once at the root via `<Provider store={store}>` in
 * `src/providers/app-providers.tsx`.
 */

import { configureStore } from '@reduxjs/toolkit';

import { authReducer } from '@/store/auth-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
