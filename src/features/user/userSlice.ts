import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UpdateUserRequest, User } from "../../types/user.ts";
import type { ApiErrorResponse } from "../../types/response.ts";
import { userApi } from "../../api/userApi.ts";
import type { RootState } from "../../store/store.ts";
import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHooks.ts";
import { loggedOut } from "../auth/authSlice.ts";
import { isAxiosError } from "axios";

export interface UserState {
    data: User | null;
    isLoading: boolean;
    error: unknown;
}

const initialState: UserState = {
    data: null,
    isLoading: false,
    error: null,
};

const extractErrorPayload = (error: unknown, fallback: string) => {
    if (isAxiosError<ApiErrorResponse>(error)) {
        const errorData = error.response?.data || { message: error.message || fallback, success: false, data: null, error: null };
        return { data: errorData, message: errorData.message || fallback, status: error.response?.status };
    }
    const message = error instanceof Error ? error.message : fallback;
    return { data: { message, success: false, data: null, error: null }, message, status: 500 };
};

export const fetchCurrentUser = createAsyncThunk(
    "user/fetchCurrentUser",
    async (_, { rejectWithValue }) => {
        try {
            return await userApi.getMe();
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to fetch user"));
        }
    }
);

export const updateCurrentUser = createAsyncThunk(
    "user/updateCurrentUser",
    async (request: UpdateUserRequest, { rejectWithValue }) => {
        try {
            return await userApi.updateMe(request);
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to update profile"));
        }
    }
);

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        clearUser: (state) => {
            state.data = null;
            state.isLoading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchCurrentUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
            state.isLoading = false;
            state.data = action.payload;
            state.error = null;
        });
        builder.addCase(fetchCurrentUser.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        });

        builder.addCase(updateCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
            state.data = action.payload;
        });

        builder.addCase(loggedOut, (state) => {
            state.data = null;
            state.isLoading = false;
            state.error = null;
        });
    },
});

export const { clearUser } = userSlice.actions;
export default userSlice.reducer;

// Selectors
export const selectCurrentUser = (state: RootState) => state.user;
export const selectCurrentUserData = (state: RootState) => state.user.data;

// Query and Mutation Hooks compatible with components
export const useGetMeQuery = (_arg?: void, options?: { skip?: boolean }) => {
    const dispatch = useAppDispatch();
    const data = useAppSelector(selectCurrentUserData);
    const isLoading = useAppSelector((state) => state.user.isLoading);
    const error = useAppSelector((state) => state.user.error);

    const refetch = useCallback(() => {
        if (!options?.skip) {
            dispatch(fetchCurrentUser());
        }
    }, [dispatch, options?.skip]);

    useEffect(() => {
        if (!options?.skip && !data) {
            dispatch(fetchCurrentUser());
        }
    }, [dispatch, options?.skip, data]);

    return {
        data,
        isLoading,
        isError: !!error,
        error,
        refetch,
    };
};

export const useUpdateMeMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (data: UpdateUserRequest) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(updateCurrentUser(data)).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useGetSignatureMutation = () => {
    const [isLoading, setIsLoading] = useState(false);

    const trigger = () => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await userApi.getSignature();
                } catch (error: unknown) {
                    throw extractErrorPayload(error, "Failed to generate signature");
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};