import { createAsyncThunk, createEntityAdapter, createSlice, type EntityState, type PayloadAction } from "@reduxjs/toolkit";
import { eventsApi } from "../../api/eventsApi.ts";
import type { ApiResponse, ApiErrorResponse } from "../../types/response.ts";
import type {
    AllEventsResponse,
    CreateEventRequest,
    CreateEventTagRequest,
    EventParticipationResponse,
    EventsMetadata,
    EventTagResponse,
    EventWithLocationAndOrganizer,
    ParticipationResponse,
    RSVP,
    UpdateEventLocationRequest,
    UpdateEventRequest,
} from "../../types/event.ts";
import type { AllEventsQueryParams, EventTagsQueryParams } from "../../types/QueryParams.ts";
import type { RootState } from "../../store/store.ts";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHooks.ts";
import { loggedOut } from "../auth/authSlice.ts";
import { isAxiosError } from "axios";

const eventsAdapter = createEntityAdapter<AllEventsResponse>();
const eventsTagsAdapter = createEntityAdapter<EventTagResponse>();
const eventsParticipationAdapter = createEntityAdapter<EventParticipationResponse>();

const initialEventsState = eventsAdapter.getInitialState<EventsMetadata>({
    totalEvents: 0,
    totalPages: 0,
    page: 1,
    limit: 4,
});

export interface EventsState {
    events: EntityState<AllEventsResponse, number> & EventsMetadata;
    focusedEvent: EventWithLocationAndOrganizer | null;
    tags: EntityState<EventTagResponse, number>;
    participation: EntityState<EventParticipationResponse, number>;
    userParticipation: Record<string, ParticipationResponse | undefined>;
    isLoadingEvents: boolean;
    isLoadingFocusedEvent: boolean;
    isLoadingTags: boolean;
    isLoadingParticipation: boolean;
    isLoadingUserParticipation: boolean;
    errorEvents: unknown;
    errorFocusedEvent: unknown;
    errorTags: unknown;
    errorParticipation: unknown;
    errorUserParticipation: unknown;
}

const initialState: EventsState = {
    events: initialEventsState,
    focusedEvent: null,
    tags: eventsTagsAdapter.getInitialState(),
    participation: eventsParticipationAdapter.getInitialState(),
    userParticipation: {},
    isLoadingEvents: false,
    isLoadingFocusedEvent: false,
    isLoadingTags: false,
    isLoadingParticipation: false,
    isLoadingUserParticipation: false,
    errorEvents: null,
    errorFocusedEvent: null,
    errorTags: null,
    errorParticipation: null,
    errorUserParticipation: null,
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
export const fetchEvents = createAsyncThunk(
    "events/fetchEvents",
    async (params: AllEventsQueryParams, { rejectWithValue }) => {
        try {
            return await eventsApi.getEvents(params);
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to fetch events"));
        }
    }
);

export const fetchEventById = createAsyncThunk(
    "events/fetchEventById",
    async (id: number, { rejectWithValue }) => {
        try {
            return await eventsApi.getEvent(id);
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to fetch event"));
        }
    }
);

export const addEvent = createAsyncThunk(
    "events/addEvent",
    async (data: CreateEventRequest, { rejectWithValue }) => {
        try {
            return await eventsApi.addEvent(data);
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to add event"));
        }
    }
);

export const updateEvent = createAsyncThunk(
    "events/updateEvent",
    async ({ id, data }: { id: number; data: UpdateEventRequest }, { rejectWithValue }) => {
        try {
            return await eventsApi.updateEvent(id, data);
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to update event"));
        }
    }
);

export const updateEventLocation = createAsyncThunk(
    "events/updateEventLocation",
    async (
        { event_id, data }: { event_id: number; data: UpdateEventLocationRequest },
        { rejectWithValue }
    ) => {
        try {
            return await eventsApi.updateEventLocation(event_id, data);
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to update location"));
        }
    }
);

export const deleteEvent = createAsyncThunk(
    "events/deleteEvent",
    async (id: number, { rejectWithValue }) => {
        try {
            await eventsApi.deleteEvent(id);
            return id;
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to delete event"));
        }
    }
);

export const deleteEventLocation = createAsyncThunk(
    "events/deleteEventLocation",
    async (id: number, { rejectWithValue }) => {
        try {
            await eventsApi.deleteEventLocation(id);
            return id;
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to delete location"));
        }
    }
);

export const fetchEventTags = createAsyncThunk(
    "events/fetchEventTags",
    async ({ event_id, params }: { event_id: number; params: EventTagsQueryParams }, { rejectWithValue }) => {
        try {
            return await eventsApi.getEventTags(event_id, params);
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to fetch tags"));
        }
    }
);

export const addEventTag = createAsyncThunk(
    "events/addEventTag",
    async ({ event_id, data }: { event_id: number; data: CreateEventTagRequest }, { rejectWithValue }) => {
        try {
            return await eventsApi.addEventTag(event_id, data);
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to add tag"));
        }
    }
);

export const deleteEventTag = createAsyncThunk(
    "events/deleteEventTag",
    async ({ event_id, tag_id }: { event_id: number; tag_id: number }, { rejectWithValue }) => {
        try {
            await eventsApi.deleteEventTag(event_id, tag_id);
            return tag_id;
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to delete tag"));
        }
    }
);

export const fetchEventParticipation = createAsyncThunk(
    "events/fetchEventParticipation",
    async (event_id: number, { rejectWithValue }) => {
        try {
            return await eventsApi.getAllEventParticipation(event_id);
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to fetch participants"));
        }
    }
);

export const fetchUserEventParticipation = createAsyncThunk(
    "events/fetchUserEventParticipation",
    async ({ event_id, user_id }: { event_id: number; user_id: number }, { rejectWithValue }) => {
        try {
            return await eventsApi.getEventParticipation(event_id, user_id);
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to fetch participation"));
        }
    }
);

export const addEventParticipation = createAsyncThunk(
    "events/addEventParticipation",
    async (
        { event_id, rsvp, email }: { event_id: number; rsvp: RSVP; email?: string },
        { dispatch, rejectWithValue }
    ) => {
        try {
            const response = await eventsApi.addEventParticipation(event_id, rsvp, email);
            dispatch(fetchEventParticipation(event_id));
            return response;
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to add participation"));
        }
    }
);

export const updateEventParticipation = createAsyncThunk(
    "events/updateEventParticipation",
    async (
        { event_id, rsvp }: { event_id: number; user_id?: number; rsvp: Omit<RSVP, "AWAITING"> },
        { dispatch, rejectWithValue }
    ) => {
        try {
            const response = await eventsApi.updateEventParticipation(event_id, rsvp);
            dispatch(fetchEventParticipation(event_id));
            return response;
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to update participation"));
        }
    }
);

export const deleteEventParticipation = createAsyncThunk(
    "events/deleteEventParticipation",
    async (
        { event_id, user_id }: { event_id: number; user_id: number },
        { dispatch, rejectWithValue }
    ) => {
        try {
            await eventsApi.deleteEventParticipation(event_id, user_id);
            dispatch(fetchEventParticipation(event_id));
            return user_id;
        } catch (error: unknown) {
            return rejectWithValue(extractErrorPayload(error, "Failed to remove participation"));
        }
    }
);

export const eventsSlice = createSlice({
    name: "events",
    initialState,
    reducers: {
        clearEventsState: (state) => {
            state.events = initialEventsState;
            state.focusedEvent = null;
            state.tags = eventsTagsAdapter.getInitialState();
            state.participation = eventsParticipationAdapter.getInitialState();
            state.userParticipation = {};
        },
    },
    extraReducers: (builder) => {
        // fetchEvents
        builder.addCase(fetchEvents.pending, (state) => {
            state.isLoadingEvents = true;
            state.errorEvents = null;
        });
        builder.addCase(
            fetchEvents.fulfilled,
            (state, action: PayloadAction<ApiResponse<AllEventsResponse[]>>) => {
                state.isLoadingEvents = false;
                eventsAdapter.setAll(state.events, action.payload.data);
                state.events.totalEvents = action.payload.meta?.totalEvents ?? 0;
                state.events.totalPages = action.payload.meta?.totalPages ?? 0;
                state.events.page = action.payload.meta?.page ?? 1;
                state.events.limit = action.payload.meta?.limit ?? 4;
            }
        );
        builder.addCase(fetchEvents.rejected, (state, action) => {
            state.isLoadingEvents = false;
            state.errorEvents = action.payload;
        });

        // fetchEventById
        builder.addCase(fetchEventById.pending, (state) => {
            state.isLoadingFocusedEvent = true;
            state.errorFocusedEvent = null;
            state.tags = eventsTagsAdapter.getInitialState();
        });
        builder.addCase(
            fetchEventById.fulfilled,
            (state, action: PayloadAction<EventWithLocationAndOrganizer>) => {
                state.isLoadingFocusedEvent = false;
                state.focusedEvent = action.payload;
            }
        );
        builder.addCase(fetchEventById.rejected, (state, action) => {
            state.isLoadingFocusedEvent = false;
            state.errorFocusedEvent = action.payload;
        });

        // addEvent
        builder.addCase(
            addEvent.fulfilled,
            (state, action: PayloadAction<EventWithLocationAndOrganizer>) => {
                state.focusedEvent = action.payload;
            }
        );

        // updateEvent
        builder.addCase(
            updateEvent.fulfilled,
            (state, action: PayloadAction<EventWithLocationAndOrganizer>) => {
                state.focusedEvent = action.payload;
                eventsAdapter.updateOne(state.events, {
                    id: action.payload.id,
                    changes: action.payload,
                });
            }
        );

        // updateEventLocation
        builder.addCase(
            updateEventLocation.fulfilled,
            (state, action: PayloadAction<EventWithLocationAndOrganizer>) => {
                state.focusedEvent = action.payload;
                eventsAdapter.updateOne(state.events, {
                    id: action.payload.id,
                    changes: action.payload,
                });
            }
        );

        // deleteEvent
        builder.addCase(deleteEvent.fulfilled, (state, action: PayloadAction<number>) => {
            eventsAdapter.removeOne(state.events, action.payload);
            if (state.focusedEvent?.id === action.payload) {
                state.focusedEvent = null;
            }
        });

        // deleteEventLocation
        builder.addCase(deleteEventLocation.fulfilled, (state, action: PayloadAction<number>) => {
            if (state.focusedEvent?.id === action.payload) {
                state.focusedEvent.location_name = null;
            }
        });

        // tags
        builder.addCase(fetchEventTags.pending, (state) => {
            state.isLoadingTags = true;
        });
        builder.addCase(
            fetchEventTags.fulfilled,
            (state, action: PayloadAction<EventTagResponse[]>) => {
                state.isLoadingTags = false;
                eventsTagsAdapter.upsertMany(state.tags, action.payload);
            }
        );
        builder.addCase(fetchEventTags.rejected, (state, action) => {
            state.isLoadingTags = false;
            state.errorTags = action.payload;
        });
        builder.addCase(
            addEventTag.fulfilled,
            (state, action: PayloadAction<EventTagResponse>) => {
                eventsTagsAdapter.addOne(state.tags, action.payload);
            }
        );
        builder.addCase(deleteEventTag.fulfilled, (state, action: PayloadAction<number>) => {
            eventsTagsAdapter.removeOne(state.tags, action.payload);
        });

        // participation
        builder.addCase(fetchEventParticipation.pending, (state) => {
            state.isLoadingParticipation = true;
        });
        builder.addCase(
            fetchEventParticipation.fulfilled,
            (state, action: PayloadAction<EventParticipationResponse[]>) => {
                state.isLoadingParticipation = false;
                eventsParticipationAdapter.setAll(state.participation, action.payload);
            }
        );
        builder.addCase(fetchEventParticipation.rejected, (state, action) => {
            state.isLoadingParticipation = false;
            state.errorParticipation = action.payload;
        });
        builder.addCase(
            fetchUserEventParticipation.fulfilled,
            (state, action) => {
                const { event_id, user_id } = action.meta.arg;
                state.userParticipation[`${event_id}-${user_id}`] = action.payload;
            }
        );
        builder.addCase(
            deleteEventParticipation.fulfilled,
            (state, action: PayloadAction<number>) => {
                eventsParticipationAdapter.removeOne(state.participation, action.payload);
            }
        );

        // reset on logout
        builder.addCase(loggedOut, (state) => {
            state.events = initialEventsState;
            state.focusedEvent = null;
            state.tags = eventsTagsAdapter.getInitialState();
            state.participation = eventsParticipationAdapter.getInitialState();
            state.userParticipation = {};
        });
    },
});

export const { clearEventsState } = eventsSlice.actions;
export default eventsSlice.reducer;

// Selectors
const eventsSelectors = eventsAdapter.getSelectors<RootState>((state) => state.events.events);
const eventsTagsSelectors = eventsTagsAdapter.getSelectors<RootState>((state) => state.events.tags);
const eventsParticipationSelectors = eventsParticipationAdapter.getSelectors<RootState>((state) => state.events.participation);

export const {
    selectAll: selectAllEventsFromAdapter,
    selectById: selectEventById,
    selectIds: selectEventIds,
    selectEntities: selectEventEntities,
    selectTotal: selectEventsTotal,
} = eventsSelectors;

export const selectAllEvents = (_params?: AllEventsQueryParams) => {
    void _params;
    return eventsSelectors.selectAll;
};

const selectEventsTotalCountSelector = (state: RootState) => state.events.events.totalEvents ?? 0;
export const selectEventsTotalCount = (_params?: AllEventsQueryParams) => {
    void _params;
    return selectEventsTotalCountSelector;
};

const selectEventsTotalPagesCountSelector = (state: RootState) => state.events.events.totalPages ?? 0;
export const selectEventsTotalPagesCount = (_params?: AllEventsQueryParams) => {
    void _params;
    return selectEventsTotalPagesCountSelector;
};

export const selectAllEventTags = (_eventId?: number, _params?: EventTagsQueryParams) => {
    void _eventId;
    void _params;
    return eventsTagsSelectors.selectAll;
};

export const selectAllEventParticipation = (_eventId?: number) => {
    void _eventId;
    return eventsParticipationSelectors.selectAll;
};

export const selectEventParticipationByUserId = (_event_id: number, user_id: number) => {
    void _event_id;
    return (state: RootState) => {
        const list = eventsParticipationSelectors.selectAll(state);
        return list.find((p) => p.user_id === user_id);
    };
};

export const selectFocusedEvent = (state: RootState) => state.events.focusedEvent;

// Compatible Query & Mutation Hooks
export const useGetEventsQuery = (params: AllEventsQueryParams) => {
    const dispatch = useAppDispatch();
    const data = useAppSelector((state) => state.events.events);
    const isLoading = useAppSelector((state) => state.events.isLoadingEvents);
    const error = useAppSelector((state) => state.events.errorEvents);
    const serializedParams = JSON.stringify(params);

    const refetch = useCallback(() => {
        dispatch(fetchEvents(params));
    }, [dispatch, serializedParams]);

    useEffect(() => {
        dispatch(fetchEvents(params));
    }, [dispatch, serializedParams]);

    return {
        data,
        isLoading,
        isError: !!error,
        error,
        refetch,
    };
};

export const useGetEventQuery = (id: number, options?: { skip?: boolean }) => {
    const dispatch = useAppDispatch();
    const focusedEvent = useAppSelector((state) => state.events.focusedEvent);
    const isLoading = useAppSelector((state) => state.events.isLoadingFocusedEvent);
    const error = useAppSelector((state) => state.events.errorFocusedEvent);

    const refetch = useCallback(() => {
        if (!options?.skip && id) {
            dispatch(fetchEventById(id));
        }
    }, [dispatch, id, options?.skip]);

    useEffect(() => {
        if (!options?.skip && id) {
            dispatch(fetchEventById(id));
        }
    }, [dispatch, id, options?.skip]);

    return {
        data: focusedEvent?.id === id ? focusedEvent : undefined,
        isLoading,
        isError: !!error,
        error,
        refetch,
    };
};

export const useAddEventMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (data: CreateEventRequest) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(addEvent(data)).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useUpdateEventMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (params: { id: number; data: UpdateEventRequest }) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(updateEvent(params)).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useUpdateEventLocationMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (params: { event_id: number; data: UpdateEventLocationRequest }) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(updateEventLocation(params)).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useDeleteEventMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (id: number) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(deleteEvent(id)).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useDeleteEventLocationMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (id: number) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(deleteEventLocation(id)).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useGetEventTagsQuery = (
    { event_id, params }: { event_id: number; params: EventTagsQueryParams },
    options?: { skip?: boolean }
) => {
    const dispatch = useAppDispatch();
    const data = useAppSelector((state) => state.events.tags);
    const isLoading = useAppSelector((state) => state.events.isLoadingTags);
    const error = useAppSelector((state) => state.events.errorTags);
    const fetchEventOrganizersTags = params?.fetchEventOrganizersTags;
    const skip = options?.skip;

    const refetch = useCallback(() => {
        if (!skip && event_id) {
            dispatch(fetchEventTags({ event_id, params: { fetchEventOrganizersTags: !!fetchEventOrganizersTags } }));
        }
    }, [dispatch, event_id, fetchEventOrganizersTags, skip]);

    useEffect(() => {
        if (!skip && event_id) {
            dispatch(fetchEventTags({ event_id, params: { fetchEventOrganizersTags: !!fetchEventOrganizersTags } }));
        }
    }, [dispatch, event_id, fetchEventOrganizersTags, skip]);

    return {
        data,
        isLoading,
        isError: !!error,
        error,
        refetch,
    };
};

export const useAddEventTagMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (params: { event_id: number; data: CreateEventTagRequest }) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(addEventTag(params)).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useDeleteEventTagMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (params: { event_id: number; tag_id: number }) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(deleteEventTag(params)).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useGetAllEventParticipationQuery = (event_id: number, options?: { skip?: boolean }) => {
    const dispatch = useAppDispatch();
    const data = useAppSelector((state) => state.events.participation);
    const isLoading = useAppSelector((state) => state.events.isLoadingParticipation);
    const error = useAppSelector((state) => state.events.errorParticipation);

    const refetch = useCallback(() => {
        if (!options?.skip && event_id) {
            dispatch(fetchEventParticipation(event_id));
        }
    }, [dispatch, event_id, options?.skip]);

    useEffect(() => {
        if (!options?.skip && event_id) {
            dispatch(fetchEventParticipation(event_id));
        }
    }, [dispatch, event_id, options?.skip]);

    return {
        data,
        isLoading,
        isError: !!error,
        error,
        refetch,
    };
};

export const useGetEventParticipationQuery = (
    { event_id, user_id }: { event_id: number; user_id: number },
    options?: { skip?: boolean }
) => {
    const dispatch = useAppDispatch();
    const participationMap = useAppSelector((state) => state.events.userParticipation);
    const key = `${event_id}-${user_id}`;
    const data = participationMap[key];
    const isLoading = useAppSelector((state) => state.events.isLoadingUserParticipation);
    const error = useAppSelector((state) => state.events.errorUserParticipation);

    const refetch = useCallback(() => {
        if (!options?.skip && event_id && user_id) {
            dispatch(fetchUserEventParticipation({ event_id, user_id }));
        }
    }, [dispatch, event_id, user_id, options?.skip]);

    useEffect(() => {
        if (!options?.skip && event_id && user_id) {
            dispatch(fetchUserEventParticipation({ event_id, user_id }));
        }
    }, [dispatch, event_id, user_id, options?.skip]);

    return {
        data,
        isLoading,
        isError: !!error,
        error,
        refetch,
    };
};

export const useAddEventParticipationMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (params: { event_id: number; rsvp: RSVP; email?: string }) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(addEventParticipation(params)).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useUpdateEventParticipationMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (params: { event_id: number; user_id?: number; rsvp: Omit<RSVP, "AWAITING"> }) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(updateEventParticipation(params)).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};

export const useDeleteEventParticipationMutation = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const trigger = (params: { event_id: number; user_id: number }) => {
        return {
            unwrap: async () => {
                setIsLoading(true);
                try {
                    return await dispatch(deleteEventParticipation(params)).unwrap();
                } finally {
                    setIsLoading(false);
                }
            },
        };
    };

    return [trigger, { isLoading }] as const;
};