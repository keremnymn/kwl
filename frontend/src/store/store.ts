import { configureStore } from "@reduxjs/toolkit";
import User from "./auth/authSlice"

import OwnerInfo from "./ticket/ownerSlice"
import VisitorInfo from "./ticket/visitorSlice"
import BaseInfo from "./ticket/baseInfo"

function saveToLocalStorage(store: any) {
    try {
        const serializedStore = JSON.stringify(store);
        window.localStorage.setItem('store', serializedStore);
    } catch(e) {
        console.info(e);
    }
}

function loadFromLocalStorage() {
    try {
        const serializedStore = window.localStorage.getItem('store');
        if(serializedStore === null) return undefined;
        return JSON.parse(serializedStore);
    } catch(e) {
        console.info(e);
        return undefined;
    }
}

const persistedState = loadFromLocalStorage();

export const store = configureStore({
    preloadedState: persistedState,
    reducer: {
        auth: User,
        owner: OwnerInfo,
        visitor: VisitorInfo,
        ticketBase: BaseInfo
    },
    middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

store.subscribe(() => saveToLocalStorage(store.getState()))

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch