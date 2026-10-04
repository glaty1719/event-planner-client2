import { selectIsUpdatePasswordModalOpen, toggleUpdatePasswordModal } from "../store/slices/modalsSlice.ts";
import { useAppDispatch, useAppSelector } from "../hooks/storeHooks.ts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, CircularProgress, FormControl, InputLabel, OutlinedInput, InputAdornment, IconButton } from "@mui/material";
import type {PasswordUpdateRequest} from "../types/auth.ts";
import {PasswordUpdateRequestSchema} from "../schemas/authSchema.ts";
import {useUpdatePasswordMutation} from "../features/auth/authSlice.ts";
import {toast} from "react-toastify";
import {useState} from "react";
import * as React from "react";
import {Visibility, VisibilityOff } from "@mui/icons-material";
import type {ApiErrorResponse} from "../types/response.ts";

export const UpdatePasswordModal = () => {
    const dispatch = useAppDispatch();
    const isDialogBoxOpen = useAppSelector(selectIsUpdatePasswordModalOpen);

    const [updatePassword, { isLoading: isUpdating }] = useUpdatePasswordMutation();

    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };
    const {
        handleSubmit,
        register,
        formState: { errors },
        reset,
        trigger,
    } = useForm<PasswordUpdateRequest>({
        resolver: zodResolver(PasswordUpdateRequestSchema),
        mode: "onBlur",
    });

    const handleCancel = () => {
        reset();
        dispatch(toggleUpdatePasswordModal());
    };

    const onSubmit = async (data: PasswordUpdateRequest) => {
        try {
            await updatePassword(data).unwrap();
            reset();
            dispatch(toggleUpdatePasswordModal());
            toast.success("Password updated successfully.");

        } catch (error) {
            dispatch(toggleUpdatePasswordModal());
            const err = error as { data: ApiErrorResponse };
            toast.error(err.data?.message || "Failed Updating Password!");
        }
    };

    return (
        <Dialog
            open={isDialogBoxOpen}
            onClose={handleCancel}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle>
                <Typography variant="h5" component="span" sx={{ fontWeight: "bold" }}>
                    Update Password
                </Typography>
            </DialogTitle>

            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent dividers>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <FormControl  variant="outlined" fullWidth>
                            <InputLabel htmlFor="outlined-adornment-password">Old Password</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-password"
                                type={showPassword ? 'text' : 'password'}
                                {...register("old_password")}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={
                                                showPassword ? 'hide the password' : 'display the password'
                                            }
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            onMouseUp={handleMouseUpPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                label="Old Password"
                            />
                            {errors.old_password && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                    {errors.old_password.message}
                                </Typography>
                            )}
                        </FormControl>
                        <FormControl  variant="outlined" fullWidth>
                            <InputLabel htmlFor="outlined-adornment-password">New Password</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-password"
                                type={showPassword ? 'text' : 'password'}
                                {...register("new_password", {
                                    onChange: () => {
                                        trigger("confirm_new_password");
                                    }
                                })}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={
                                                showPassword ? 'hide the password' : 'display the password'
                                            }
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            onMouseUp={handleMouseUpPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                label="New Password"
                            />
                            {errors.new_password && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                    {errors.new_password.message}
                                </Typography>
                            )}
                        </FormControl>
                        <FormControl  variant="outlined" fullWidth>
                            <InputLabel htmlFor="outlined-adornment-password">Confirm New Password</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-password"
                                type={showPassword ? 'text' : 'password'}
                                {...register("confirm_new_password")}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={
                                                showPassword ? 'hide the password' : 'display the password'
                                            }
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            onMouseUp={handleMouseUpPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                label="Confirm New Password"
                            />
                            {errors.confirm_new_password && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                    {errors.confirm_new_password.message}
                                </Typography>
                            )}
                        </FormControl>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleCancel} color="inherit" disabled={isUpdating}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isUpdating}
                        startIcon={isUpdating ? <CircularProgress size={20} /> : null}
                    >
                        {isUpdating ? "Updating..." : "Update Password "}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};