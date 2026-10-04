import './App.css'
import {AppRoutes} from "./components/AppRoutes.tsx";
import {ToastContainer} from "react-toastify";
import {getSessionPersistence, getUserAuth, useRefreshMutation} from "./features/auth/authSlice.ts";
import {useAppSelector} from "./hooks/storeHooks.ts";
import {useEffect} from "react";
import {CircularProgress} from "@mui/material";
import {ResponsiveAppBar} from "./components/ResponsiveAppBar.tsx";
import {useGetMeQuery} from "./features/user/userSlice.ts";
import {SideBar} from "./components/SideBar.tsx";
import {EventModal} from "./components/EventModal.tsx";

export const App = () => {

    const [refreshUser, { isLoading }] = useRefreshMutation();
    const isAuthenticated = useAppSelector(getUserAuth);
    const isSessionPersisted = useAppSelector(getSessionPersistence);

    useEffect(() => {
        const refresh = async() => {
            try{
                await refreshUser().unwrap();
            } catch {
                console.error("session expired");
            }
        };
        if (!isAuthenticated && isSessionPersisted) {
            refresh();
        }
    }, []);


    const {
        isLoading: meLoading,
    } = useGetMeQuery(undefined, {skip: !isAuthenticated});

    if (isLoading) return <CircularProgress />;
    if (meLoading) return <CircularProgress />;

    return (
        <div className="app-layout">
            {isAuthenticated && <ResponsiveAppBar />}
            <div className="main-container">
                {isAuthenticated && <SideBar />}
                <main className="content-area">
                    <AppRoutes />
                </main>
                <div id="event-modal">
                    <EventModal />
                </div>
            </div>
            <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
    );
};