import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import candidatesReducer from './candidatesSlice';
import interviewsReducer from './interviewsSlice';

const persistConfig = {
  key: 'ai-interview-assistant',
  storage,
  whitelist: ['candidates', 'interviews'],
};

const rootReducer = combineReducers({
  candidates: candidatesReducer,
  interviews: interviewsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;