import {type ChangeEvent, type ReactNode, useState} from "react";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import type {EventTagResponse as Tag} from "../types/event";
import './EventTags.css';
import {
    selectAllEventTags,
    useAddEventTagMutation,
    useDeleteEventTagMutation, useGetEventTagsQuery,
} from "../features/events/eventsSlice.ts";
import {
    selectFocusedEventId,
    selectIsOrganizer
} from "../store/slices/modalsSlice.ts";
import {useAppSelector} from "../hooks/storeHooks.ts";
import { toast } from "react-toastify";
import type {ApiErrorResponse} from "../types/response.ts";
import {CircularProgress, Tooltip} from "@mui/material";
import {getUserId} from "../features/auth/authSlice.ts";

const TagsAdder = () => {
    const [tag, setTag] = useState("");
    const [addNewTag, { isLoading } ] = useAddEventTagMutation();
    const focusedEventId = useAppSelector(selectFocusedEventId);
    if (!focusedEventId) return null;

    const handleTag = (e: ChangeEvent<HTMLInputElement>) => ( setTag(e.target.value));
    const handleAddNewTag = async () => {
        try{
            const tag_name = tag.trim().replace(/\b\w/g, c => c.toUpperCase());
            const data = { tag_name };
        await addNewTag({event_id: focusedEventId, data}).unwrap();
        setTag("");
        } catch(err){
            setTag("");
            console.error(err);
            //console.log(err);
            toast.error(((err as any).data as ApiErrorResponse).message);
        }
    };

    let addBtn: ReactNode;
    if (tag.trim() !== "") {
        addBtn = (
            <button
                className="addTagButton"
                style={{ color: '#2564cf'}}
                onClick={handleAddNewTag}
            >
                {isLoading ? <CircularProgress/> : "Add"}
            </button>
        );
    }

    return (
        <div className="tagAdder-container">
                <AddIcon className="add-tag-icon" />
                <input
                    className="tag-input"
                    type="text"
                    placeholder= "Add tag"
                    value={tag}
                    onChange={handleTag}
                />
                {addBtn}
        </div>
    );
};

interface TagProps {
    tag: Tag;
}
const Tag = ({tag}: TagProps) => {

    const userId = useAppSelector(getUserId);
    const isCurrentUser = userId && userId === tag.user_id;
    const focusedEventId = useAppSelector(selectFocusedEventId);
    const [ deleteTag ] = useDeleteEventTagMutation();

    const handleDeletion = async() => {
        try{
            await deleteTag({ event_id: focusedEventId!, tag_id: tag.id}).unwrap();
            toast.success("Tag Deleted!");
        } catch(err){
            console.error(err);
            toast.error(((err as any).data as ApiErrorResponse).message);
        }
    };

    return (
        <div className="tag-container">
            <span className="tag-avatar">{tag.name}</span>
            { isCurrentUser && <Tooltip title="Remove tag">
                <CloseIcon
                    className="delete-tag-btn"
                    onClick={handleDeletion}
                />
            </Tooltip>}
        </div>
    );
};

const ORGANIZER_TAGS_PARAMS = { fetchEventOrganizersTags: true };
const USER_TAGS_PARAMS = { fetchEventOrganizersTags: false };

export const Tags = () => {

    const isOrganizer = useAppSelector(selectIsOrganizer);
    const focusedEventId = useAppSelector(selectFocusedEventId);

    const {
        isLoading: isLoadingOrganizersTags,
        isError: isErrorLoadingOrganizersTags,
        error: OrganizersTagsError,
    } = useGetEventTagsQuery({ event_id: focusedEventId!, params: ORGANIZER_TAGS_PARAMS }, {skip: (!focusedEventId || isOrganizer)});

    const {
        isLoading: isLoadingUserTags,
        isError: isErrorLoadingUserTags,
        error: UserTagsError,
    } = useGetEventTagsQuery({ event_id: focusedEventId!, params: USER_TAGS_PARAMS }, {skip: !focusedEventId});

    const organizersTags = useAppSelector(selectAllEventTags(focusedEventId!, ORGANIZER_TAGS_PARAMS));
    const usersTags = useAppSelector(selectAllEventTags(focusedEventId!, USER_TAGS_PARAMS));

    if (!focusedEventId) return null;
    if (isLoadingOrganizersTags || isLoadingUserTags) return <div><CircularProgress/></div>;
    if (isErrorLoadingOrganizersTags || isErrorLoadingUserTags) {
        isErrorLoadingOrganizersTags && console.error(OrganizersTagsError);
        isErrorLoadingUserTags && console.error(UserTagsError);
        return <div>Error Loading Tags...</div>;

    }




    let organizerTags: ReactNode;
    let userTags: ReactNode;

    organizerTags = organizersTags?.map((tag) => <Tag key={tag.id} tag={tag} />);
    userTags = usersTags?.map((tag) => <Tag key={tag.id} tag={tag} />);

    return (
        <div className="tags-container">
            <div className="organizer-tag-container">
                {organizerTags}
            </div>
            <TagsAdder />
            <div className="user-tag-container">
                {userTags}
            </div>
        </div>

    );
};