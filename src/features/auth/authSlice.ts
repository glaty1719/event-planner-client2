import {
    decodeToken,
    getAccessToken,
    getPersistSession,
    setAccessToken,
    setPersistSession,
    clearTokens
} from "../../utils/tokenUtil.ts";
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../store/store.ts";
import type { AccessToken } from "../../types/token.ts";
import type {
    LoginResponseData,
    PasswordUpdateRequest,
    PasswordUpdateResponse,
    RefreshResponseData,
    SendConfirmationCodeRequest,
    UserConfirmationRequest,
    UserLoginRequest,
    UserRegisterRequest,
} from "../../types/auth.ts";
import type { ApiErrorResponse } from "../../types/response.ts";
import { authApi } from "../../api/authApi.ts";
import { useState } from "react";
import { useAppDispatch } from "../../hooks/storeHooks.ts";
import { isAxiosError } from "axios";

export interface AuthState {
    id: number | undefined;
    accessToken: string | undefined;
    email: string | undefined;
    isAuthenticated: boolean;
    isSessionPersisted: boolean;
}

const accessToken = getAccessToken();
const persistSession = getPersistSession();
const decodedAccessToken = decodeToken(accessToken) as AccessToken;

const initialState: AuthState = {
    id: decodedAccessToken?.id,
    accessToken,
    email: decodedAccessToken?.email,
    isAuthenticated: !!decodedAccessToken,
    isSessionPersisted: persistSession,
};

const extractErrorPayload = (error: unknown, fallback: string) => {
    if (isAxiosError<ApiErrorResponse>(error)) {
        const errorData = error.response?.data || { message: error.message || fallback, success: false, data: null, error: null };
        return { data: errorData, message: errorData.message || fallback, status: error.response?.status };
    }
    const message = error instanceof Error ? error.message : fallback;
    return { data: { message, success: false, data: null, error: null }, message, status: 500 };
};

// Async Thunks
export const loginUser = createAsyncThunk(
    "auth/login",
    async (data: UserLoginRequest, { rejectWithValue }) => {
        try {
            return await authApi.login(data);
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Login failed"));
        }
    }
);

export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            return await authApi.logout();
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Logout failed"));
        }
    }
);

export const refreshSession = createAsyncThunk(
    "auth/refresh",
    async (_, { rejectWithValue }) => {
        try {
            return await authApi.refresh();
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Session refresh failed"));
        }
    }
);

export const updatePasswordThunk = createAsyncThunk(
    "auth/updatePassword",
    async (data: PasswordUpdateRequest, { rejectWithValue }) => {
        try {
            return await authApi.updatePassword(data);
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to update password"));
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        tokenReceived: (state, action: PayloadAction<string>) => {
            state.accessToken = action.payload;
            const decoded = decodeToken(action.payload) as AccessToken;
            if (decoded) {
                state.id = decoded.id;
                state.email = decoded.email;
                state.isAuthenticated = true;
            }
        },
        loggedOut: (state) => {
            state.id = undefined;
            state.accessToken = undefined;
            state.email = undefined;
            state.isAuthenticated = false;
            state.isSessionPersisted = false;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponseData>) => {
            if ("accessToken" in action.payload && action.payload.accessToken) {
                const token = action.payload.accessToken;
                state.accessToken = token;
                setAccessToken(token);
                setPersistSession(true);

                const decoded = decodeToken(token) as AccessToken;
                state.id = decoded?.id;
                state.email = decoded?.email;
                state.isAuthenticated = true;
                state.isSessionPersisted = true;
            }
        });

        builder.addCase(refreshSession.fulfilled, (state, action: PayloadAction<RefreshResponseData>) => {
            const token = action.payload.accessToken;
            if (token) {
                state.accessToken = token;
                setAccessToken(token);
                setPersistSession(true);

                const decoded = decodeToken(token) as AccessToken;
                state.id = decoded?.id;
                state.email = decoded?.email;
                state.isAuthenticated = true;
                state.isSessionPersisted = true;
            }
        });

        builder.addCase(updatePasswordThunk.fulfilled, (state, action: PayloadAction<PasswordUpdateResponse>) => {
            const token = action.payload.accessToken;
            if (token) {
                state.accessToken = token;
                setAccessToken(token);
            }
        });

        builder.addCase(logoutUser.fulfilled, (state) => {
            state.id = undefined;
            state.accessToken = undefined;
            state.email = undefined;
            state.isAuthenticated = false;
            state.isSessionPersisted = false;
            clearTokens();
        });
    },
});

export default authSlice.reducer;

// Action creators
export const { tokenReceived, loggedOut } = authSlice.actions;

// Selectors
export const getUserId = (state: RootState) => state.auth.id;
export const getUserAuth = (state: RootState) => state.auth.isAuthenticated;
export const getUserEmail = (state: RootState) => state.auth.email;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const getSessionPersistence = (state: RootState) => state.auth.isSessionPersisted;

// Compatible Mutation Hooks
export const useLoginMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const trigger = (data: UserLoginRequest) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                setIsError(false);
                setError(null);
                try {
                    const result = await dispatch(loginUser(data)).unwrap();
                    setIsSuccess(true);
                    return result;
                } catch (err) {
                    setIsError(true);
                    setError(err);
                    throw err;
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading, isSuccess, isError, error }] as const;
};

export const useLogoutMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = () => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    const result = await dispatch(logoutUser()).unwrap();
                    clearTokens();
                    return result;
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useRegisterMutation = () => {
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (data: UserRegisterRequest) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await authApi.register(data);
                } catch (error: unknown) {
                    throw extractErrorPayload(error, "Registration failed");
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useRefreshMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = () => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(refreshSession()).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useConfirmMutation = () => {
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (data: UserConfirmationRequest) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await authApi.confirm(data);
                } catch (error: unknown) {
                    throw extractErrorPayload(error, "Confirmation failed");
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useResendConfirmationCodeMutation = () => {
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (data: SendConfirmationCodeRequest) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await authApi.resendConfirmationCode(data);
                } catch (error: unknown) {
                    throw extractErrorPayload(error, "Resending code failed");
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useUpdatePasswordMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (data: PasswordUpdateRequest) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(updatePasswordThunk(data)).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};