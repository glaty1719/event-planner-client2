import {CircularProgress} from "@mui/material";
import {toast} from "react-toastify";

import {useAppSelector} from "../hooks/storeHooks.ts";
import {selectFocusedEventId} from "../store/slices/modalsSlice.ts";
import {
    selectEventParticipationByUserId,
    useAddEventParticipationMutation,
    useGetEventParticipationQuery,
    useUpdateEventParticipationMutation
} from "../features/events/eventsSlice.ts";
import {getUserId} from "../features/auth/authSlice.ts";
import {RSVP as RsvpStatus} from "../constants/appConstants.ts";
import type {ApiErrorResponse} from "../types/response.ts";

import "./rsvp.css";
import type {RSVP} from "../types/event.ts";
import {useState} from "react";

interface RsvpProps {
    event_date: number;
}

export const EventRSVP = ({ event_date }: RsvpProps) => {
    const currentUserId = useAppSelector(getUserId);
    const focusedEventId = useAppSelector(selectFocusedEventId);

    const isPastEvent = new Date(event_date).getTime() < Date.now();

    // Fetch user's participation status
    const { isLoading: isFetching } = useGetEventParticipationQuery(
        { event_id: focusedEventId!, user_id: currentUserId! },
        { skip: !focusedEventId || !currentUserId }
    );

    const participation = useAppSelector(
        selectEventParticipationByUserId(focusedEventId!, currentUserId!)
    );

    const [prticiptn, setPrticiptn] = useState<RSVP | undefined>(participation ? participation.rsvp : undefined);

    const [updateEventParticipation, { isLoading: isUpdating }] = useUpdateEventParticipationMutation();
    const [addParticipation, { isLoading: isParticipating }] = useAddEventParticipationMutation();

    const isDisabled = isFetching || isPastEvent || isUpdating;
    if (!focusedEventId || !participation || !currentUserId) return null;

    const handleAddParticipation = async (rsvp: RSVP) => {
        try {
            await addParticipation({ event_id: focusedEventId, rsvp }).unwrap();
            toast.success(`Responded ${rsvp}`);
        } catch (err) {
            console.error(err);
            toast.error(((err as any).data as ApiErrorResponse).message);
        }
    };

    const handleUpdate = async (rsvp: RSVP) => {
        try {
            const data = await updateEventParticipation({
                event_id: focusedEventId!,
                user_id: currentUserId!,
                rsvp
            }).unwrap();
            //console.log(data);
            setPrticiptn(data.rsvp);
            toast.success(`Responded ${rsvp}`);
        } catch (error) {
            console.error("Failed to update RSVP status:", error);
            toast.error(((error as any).data as ApiErrorResponse)?.message || "Failed to update RSVP.");
        }
    };

    const handleRsvpChange = async (rsvp: RSVP) => {
        if (isDisabled || isUpdating ) return;
        if (participation.rsvp) await handleUpdate(rsvp);
        else await handleAddParticipation(rsvp);
    };

    return (
        <div className={`rsvp-section-container ${isDisabled ? "disabled" : ""}`}>
            <span className="rsvp-title">Going?</span>

            <div className="rsvp-options-wrapper">
                {/* YES OPTION */}
                <button
                    className={`rsvp-btn yes ${participation.rsvp === RsvpStatus.YES ? "active" : ""}`}
                    onClick={() => handleRsvpChange(RsvpStatus.YES)}
                    title="Respond YES"
                    disabled={isDisabled || isUpdating || prticiptn === RsvpStatus.YES}
                    type="button"
                >
                    <span>Yes</span>
                </button>

                {/* MAYBE OPTION */}
                <button
                    className={`rsvp-btn maybe ${participation.rsvp === RsvpStatus.MAYBE ? "active" : ""}`}
                    onClick={() => handleRsvpChange(RsvpStatus.MAYBE)}
                    title="Respond MAYBE"
                    disabled={isDisabled || isUpdating || prticiptn === RsvpStatus.MAYBE}
                    type="button"
                >
                    <span>Maybe</span>
                </button>

                {/* NO OPTION */}
                <button
                    className={`rsvp-btn no ${participation.rsvp === RsvpStatus.NO ? "active" : ""}`}
                    onClick={() => handleRsvpChange(RsvpStatus.NO)}
                    title="Respond NO"
                    disabled={isDisabled || isUpdating || prticiptn === RsvpStatus.NO}
                    type="button"
                >
                    <span>No</span>
                </button>
            </div>

            {isUpdating || isParticipating || isFetching  && (
                <div className="rsvp-inline-loader">
                    <CircularProgress size={14} />
                </div>
            )}
        </div>
    );
};