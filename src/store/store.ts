import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.ts";
import eventsReducer from "../features/events/eventsSlice.ts";
import userReducer from "../features/user/userSlice.ts";
import modalsReducer from "./slices/modalsSlice.ts";
import { injectStore } from "../utils/http.ts";

export const store = configureStore({
    reducer: {
        modals: modalsReducer,
        auth: authReducer,
        events: eventsReducer,
        user: userReducer,
    },
});

injectStore(store.dispatch, store.getState);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;