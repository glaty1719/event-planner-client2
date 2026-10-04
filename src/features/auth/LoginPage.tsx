import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAppSelector } from "../../hooks/storeHooks.ts";
import {
    Box,
    Button,
    TextField,
    Typography,
    Link,
    InputAdornment,
    IconButton, FormControl,
    OutlinedInput, CircularProgress
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { UserLoginRequestSchema } from "../../schemas/authSchema";
import type {UnconfirmedUserResponse, UserLoginRequest} from "../../types/auth.ts";
import { getUserAuth, useLoginMutation } from "./authSlice.ts";
import type { ApiErrorResponse } from "../../types/response.ts";
import "./LoginPage.css";
import {useModalGuard} from "../../hooks/eventHooks.ts";

export const LoginPage = () => {
    useModalGuard();
    //const location = useLocation();
    //const notAuthenticated = location?.state?.notAuthenticated as boolean;
    const [loginUser, { isLoading, isSuccess }] = useLoginMutation();
    const navigate = useNavigate();
    const isAuthenticated = useAppSelector(getUserAuth);

    const [showPassword, setShowPassword] = useState(false);

    const {
        handleSubmit,
        register,
        formState: { errors },
    } = useForm<UserLoginRequest>({
        resolver: zodResolver(UserLoginRequestSchema),
        mode: "onBlur"
    });

    const onSubmit = async (data: UserLoginRequest) => {
        try {
            const response = await loginUser(data).unwrap();
            //console.log(response);
            if ("expires_at" in response) {
                const { email, expires_at } = response as UnconfirmedUserResponse ;
                //console.log("i am here");
            navigate(response.next, { state: { email, expires_at } });
            }
            else if ("accessToken" in response) {
                navigate(response.next);
            }
            //console.log("i am here ***");
        } catch (error) {
            const err = error as { data: ApiErrorResponse };
            toast.error(err.data?.message || "Failed to log in");
        }
    };

    useEffect(() => {
        // why am i using isSuccess here? --- analyse later MAY BE TO STOP REDIRECTION OR MULTIPLE RELOAD/REDIRECTS etc ???
        if (isAuthenticated && !isSuccess) {
            navigate('/events/my-day');
        }
        /*if (notAuthenticated) {
            toast.info("Please login first!");
        }*/
    }, [isAuthenticated, isSuccess, navigate]);

    return (
        <Box className="login-container" sx={{ display: 'flex', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, bgcolor: '#f5f5f5', p: 4, alignItems: 'center' }}>
                <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                    EVENT PLANNER
                </Typography>
            </Box>

            <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2" sx={{ alignSelf: 'flex-end', mb: 4 }}>
                    Don't have an account?{' '}
                    <Link component="button" onClick={() => navigate("/register")} sx={{ fontWeight: 'bold', color: 'inherit' }}>
                        Register now
                    </Link>
                </Typography>

                <Box sx={{ maxWidth: 400, mx: 'auto', mt: '5%' }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
                        Welcome! Login to your account or click Register now to create a new account.
                    </Typography>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                            <TextField
                                {...register("email")}
                                variant="outlined"
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                fullWidth
                                placeholder="email"
                            />

                            <FormControl variant="outlined" fullWidth>
                                <OutlinedInput
                                    id="outlined-adornment-password"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register("password")}
                                    notched // Keeps the label gap open for the shrink prop
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                    placeholder="Password"
                                />
                            </FormControl>

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={isLoading}
                                color="primary"
                            >
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Login"}                            </Button>
                        </Box>
                    </form>
                </Box>
            </Box>
        </Box>
    );
};
