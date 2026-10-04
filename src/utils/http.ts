import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { Mutex } from "async-mutex";
import { config } from "../config.ts";
import { clearTokens, getAccessToken, getPersistSession, setAccessToken } from "./tokenUtil.ts";
import { httpCodes } from "../constants/httpCodes.ts";
import type { ApiResponse } from "../types/response.ts";
import type { RefreshResponseData } from "../types/auth.ts";
import {loggedOut, selectAccessToken, tokenReceived} from "../features/auth/authSlice.ts";
import type {RootState} from "../store/store.ts";

export const http = axios.create({
    baseURL: config.apiBaseURI,
    withCredentials: true,
});

let storeDispatch: ((action: unknown) => void) | null = null;
// http.ts
let storeGetState: (() => RootState) | null = null;

export const injectStore = (
    dispatch: (action: unknown) => void,
    getState: () => RootState
) => {
    storeDispatch = dispatch;
    storeGetState = getState;
};

// Request Interceptor
http.interceptors.request.use((reqConfig) => {
    if (storeGetState) {
        // Run selector directly on state snapshot
        const token = selectAccessToken(storeGetState());
        if (token && reqConfig.headers) {
            reqConfig.headers.Authorization = `Bearer ${token}`;
        }
    }
    return reqConfig;
});

const mutex = new Mutex();

// Response interceptor to handle 401 re-auth with mutex
http.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const isSessionPersisted = getPersistSession();

        if (
            originalRequest &&
            error.response?.status === httpCodes.UNAUTHORIZED.statusCode &&
            isSessionPersisted &&
            !originalRequest._retry &&
            originalRequest.url !== config.endpoints.refresh
        ) {
            originalRequest._retry = true;

            await mutex.waitForUnlock();

            if (!mutex.isLocked()) {
                const release = await mutex.acquire();
                try {
                    const refreshResponse = await axios.post<ApiResponse<RefreshResponseData>>(
                        `${config.apiBaseURI}${config.endpoints.refresh}`,
                        {},
                        { withCredentials: true }
                    );

                    const newAccessToken = refreshResponse.data?.data?.accessToken;
                    if (newAccessToken) {
                        setAccessToken(newAccessToken);
                        storeDispatch?.(tokenReceived(newAccessToken));

                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        }
                        return http(originalRequest);
                    } else {
                        clearTokens();
                        storeDispatch?.(loggedOut());
                        return Promise.reject(error);
                    }
                } catch (refreshError) {
                    clearTokens();
                    storeDispatch?.(loggedOut());
                    return Promise.reject(refreshError);
                } finally {
                    release();
                }
            } else {
                await mutex.waitForUnlock();
                const currentToken = getAccessToken();
                if (currentToken && originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${currentToken}`;
                }
                return http(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);
