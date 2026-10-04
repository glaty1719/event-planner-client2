import { useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { Box, Button, TextField, Typography, Link, Stack } from "@mui/material";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import {useModalGuard} from "../../hooks/eventHooks.ts";
import {useAppSelector} from "../../hooks/storeHooks.ts";
import {getUserAuth, useConfirmMutation, useResendConfirmationCodeMutation} from "./authSlice.ts";

export const ConfirmPage = () => {
    useModalGuard();
    const location = useLocation();
    const navigate = useNavigate();
    const [verify, { isLoading }] = useConfirmMutation();
    const [resendCode, { isLoading: isResending }] = useResendConfirmationCodeMutation();
    const isAuthenticated = useAppSelector(getUserAuth);

    const email: string = location.state?.email;
    const expires_at: number = location.state?.expires_at;
    const [_expiry, setExpiry] = useState(expires_at);

    //  Guard Clause  immediately
    useEffect(() => {
        if (!location.state?.email) {
            !isAuthenticated && toast.info("Please register first!");
            isAuthenticated ? navigate("/events/my-day"): navigate("/register");
        }
    }, [location.state, navigate, isAuthenticated]);

    // Don't render or access state if it doesn't exist
    if (!location.state?.email) return null;



    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: { code: "" }
    });

    const onSubmit = async (data: { code: string }) => {
        try {
            await verify({ email, code: data.code }).unwrap();
            toast.success("Email verified! Please login.");
            navigate("/login");
        } catch (error: any) {
            toast.error(error?.data?.message || "Invalid or expired code");
        }
    };

    const handleResend = async () => {
        try {
            const response = await resendCode({ email }).unwrap();
            setExpiry(response.expires_at);
            toast.info("New code sent to your email");
        } catch (error: any) {
            toast.error("Failed to resend code");
        }
    };

    return (
        <Box sx={{
            display: "flex", justifyContent: "center", alignItems: "center",
            minHeight: "100vh", bg: "#f5f5f5"
        }}>
            <Box sx={{
                width: 400,
                p: 4,
                borderRadius: 2,
                boxShadow: 3,
                textAlign: "center",
                color: "white"
            }}>
                <Typography sx={{
                    variant:"h5",
                    fontWeight:"bold",
                    gutterBottom: "true",
                }}>
                    Confirm your email
                </Typography>
                <Typography sx={{
                    variant:"body2",
                    mb: 3,
                    color: "#000000"
                }}>
                    Enter the code we sent to <strong>{email}</strong>
                </Typography>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack spacing={2}>
                        <TextField
                            {...register("code")}
                            placeholder="6-digit code"
                            variant="outlined"
                            fullWidth
                            error={!!errors.code}
                            helperText={errors.code?.message}
                            slotProps={{
                                input:{
                                    style: { textAlign: 'center', letterSpacing: '8px', color: 'black' } }
                            }}
                            sx={{ bgcolor: "#f5f5f5", borderRadius: 1 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isLoading}
                            sx={{ mt: 2, bgcolor: "#0067b8" }} // Microsoft blue
                        >
                            {isLoading ? "Confirming..." : "Confirm"}
                        </Button>
                    </Stack>
                </form>

                <Box sx={{ mt: 3 }}>
                    <Link
                        component="button"
                        variant="body2"
                        onClick={handleResend}
                        disabled={isResending}
                        sx={{ color: "#4da3ff", textDecoration: "none" }}
                    >
                        Resend code
                    </Link>
                    <Typography sx={{
                        variant:"body2",
                        mb: 3,
                        color: "#000000"
                    }}>
                        Don't forget to check the spam folder !!!
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};