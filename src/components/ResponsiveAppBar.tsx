import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import {useLogoutMutation} from "../features/auth/authSlice.ts";
import { toast } from "react-toastify";
import type {ApiErrorResponse} from "../types/response.ts";
import {Link, useNavigate} from "react-router";
import {CircularProgress} from "@mui/material";
import {selectCurrentUserData} from "../features/user/userSlice.ts";
import {useAppSelector} from "../hooks/storeHooks.ts";

export const ResponsiveAppBar = () => {

    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
    const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
    const navigate = useNavigate();

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleLogout = async() => {
        try {
            await logout().unwrap();
            setAnchorElUser(null);
            navigate("/");
        } catch (error) {
            toast.error(((error as any).data as ApiErrorResponse).message);
        }
    };

    const handleProfileNav = () => {
        setAnchorElUser(null);
        navigate("/my-profile");
    };
    const me = useAppSelector(selectCurrentUserData);
    if (!me) return null;

    return (
        <AppBar position="static" elevation={0}>
            <Box sx={{ px: 3 }}>
                <Toolbar disableGutters>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: 'inherit',
                            flexGrow: 1,
                        }}
                    >
                        <ViewTimelineIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1.5 }} />
                        <Typography
                            variant="h6"
                            component={Link}
                            to="/events/my-day"
                            noWrap
                            sx={{
                                display: { xs: 'none', md: 'flex' },
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                fontWeight: 700,
                                letterSpacing: '.05rem',
                                color: 'inherit',
                                textDecoration: 'none',
                            }}
                        >
                            Event Planner
                        </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 0 }}>
                        <Tooltip title="Open settings">
                            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                <Avatar alt="" src={me.profile_picture} />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            sx={{ mt: '45px' }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >
                            <MenuItem
                                key="profile"
                                onClick={handleProfileNav}
                                sx={{ minWidth: 120, justifyContent: 'center' }}
                            >
                                <Typography sx={{ textAlign: 'center' }}>Profile</Typography>
                            </MenuItem>
                            <MenuItem
                                key="logout"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                sx={{ minWidth: 120, justifyContent: 'center' }}
                            >
                                {isLoggingOut ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    <Typography sx={{ textAlign: 'center' }}>Logout</Typography>
                                )}
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </Box>
        </AppBar>
    );
};