import { http } from "../utils/http.ts";
import { config } from "../config.ts";
import type { ApiResponse } from "../types/response.ts";
import type {
    AllEventsResponse,
    CreateEventRequest,
    CreateEventTagRequest,
    EventParticipationResponse,
    EventTagResponse,
    EventWithLocationAndOrganizer,
    ParticipationResponse,
    RSVP,
    UpdateEventLocationRequest,
    UpdateEventRequest,
} from "../types/event.ts";
import type { AllEventsQueryParams, EventTagsQueryParams } from "../types/QueryParams.ts";

export const eventsApi = {
    async getEvents(params: AllEventsQueryParams): Promise<ApiResponse<AllEventsResponse[]>> {
        const response = await http.get<ApiResponse<AllEventsResponse[]>>(config.endpoints.events, {
            params,
        });
        return response.data;
    },

    async getEvent(id: number): Promise<EventWithLocationAndOrganizer> {
        const response = await http.get<ApiResponse<EventWithLocationAndOrganizer>>(
            `${config.endpoints.events}/${id}`
        );
        return response.data.data;
    },

    async addEvent(data: CreateEventRequest): Promise<EventWithLocationAndOrganizer> {
        const response = await http.post<ApiResponse<EventWithLocationAndOrganizer>>(
            config.endpoints.events,
            data
        );
        return response.data.data;
    },

    async updateEvent(id: number, data: UpdateEventRequest): Promise<EventWithLocationAndOrganizer> {
        const response = await http.patch<ApiResponse<EventWithLocationAndOrganizer>>(
            `${config.endpoints.events}/${id}`,
            data
        );
        return response.data.data;
    },

    async updateEventLocation(
        eventId: number,
        data: UpdateEventLocationRequest
    ): Promise<EventWithLocationAndOrganizer> {
        const response = await http.patch<ApiResponse<EventWithLocationAndOrganizer>>(
            `${config.endpoints.events}/${eventId}/location`,
            data
        );
        return response.data.data;
    },

    async deleteEvent(id: number): Promise<{ success: boolean }> {
        const response = await http.delete<ApiResponse<{ success: boolean }>>(
            `${config.endpoints.events}/${id}`
        );
        return response.data.data;
    },

    async deleteEventLocation(eventId: number): Promise<{ success: boolean }> {
        const response = await http.delete<ApiResponse<{ success: boolean }>>(
            `${config.endpoints.events}/${eventId}/location`
        );
        return response.data.data;
    },

    async getEventTags(
        eventId: number,
        params: EventTagsQueryParams
    ): Promise<EventTagResponse[]> {
        const response = await http.get<ApiResponse<EventTagResponse[]>>(
            `${config.endpoints.events}/${eventId}/tags`,
            { params }
        );
        return response.data.data;
    },

    async addEventTag(eventId: number, data: CreateEventTagRequest): Promise<EventTagResponse> {
        const response = await http.post<ApiResponse<EventTagResponse>>(
            `${config.endpoints.events}/${eventId}/tags`,
            data
        );
        return response.data.data;
    },

    async deleteEventTag(eventId: number, tagId: number): Promise<{ success: boolean }> {
        const response = await http.delete<ApiResponse<{ success: boolean }>>(
            `${config.endpoints.events}/${eventId}/tags/${tagId}`
        );
        return response.data.data;
    },

    async getAllEventParticipation(eventId: number): Promise<EventParticipationResponse[]> {
        const response = await http.get<ApiResponse<EventParticipationResponse[]>>(
            `${config.endpoints.events}/${eventId}/participation`
        );
        return response.data.data;
    },

    async getEventParticipation(eventId: number, userId: number): Promise<ParticipationResponse> {
        const response = await http.get<ApiResponse<ParticipationResponse>>(
            `${config.endpoints.events}/${eventId}/participation/${userId}`
        );
        return response.data.data;
    },

    async addEventParticipation(
        eventId: number,
        rsvp: RSVP,
        email?: string
    ): Promise<ParticipationResponse> {
        const response = await http.post<ApiResponse<ParticipationResponse>>(
            `${config.endpoints.events}/${eventId}/participation`,
            { rsvp, email }
        );
        return response.data.data;
    },

    async updateEventParticipation(
        eventId: number,
        rsvp: Omit<RSVP, "AWAITING">
    ): Promise<EventParticipationResponse> {
        const response = await http.patch<ApiResponse<EventParticipationResponse>>(
            `${config.endpoints.events}/${eventId}/participation`,
            { rsvp }
        );
        return response.data.data;
    },

    async deleteEventParticipation(eventId: number, userId: number): Promise<{ success: boolean }> {
        const response = await http.delete<ApiResponse<{ success: boolean }>>(
            `${config.endpoints.events}/${eventId}/participation/${userId}`
        );
        return response.data.data;
    },
};
