import {type ReactNode, useEffect, useState} from "react";
import {useNavigate} from "react-router";
import {
    Box,
    Button,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    Link,
    OutlinedInput,
    TextField,
    Typography
} from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import {toast} from "react-toastify";
import {UserRegisterRequestSchema} from "../../schemas/authSchema";
import type {UserRegisterRequest} from "../../types/auth.ts";
import * as React from "react";
import {Visibility, VisibilityOff } from "@mui/icons-material";
import {useModalGuard} from "../../hooks/eventHooks.ts";
import {useAppSelector} from "../../hooks/storeHooks.ts";
import {getUserAuth, useRegisterMutation} from "./authSlice.ts";

export const RegisterPage = () => {
    useModalGuard();
    const [registerUser, { isLoading}] = useRegisterMutation();
    const navigate = useNavigate();
    const isAuthenticated = useAppSelector(getUserAuth);

    const {
        handleSubmit,
        register,
        trigger,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(UserRegisterRequestSchema),
        mode: "onChange"
    });


    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
        navigate("/events/my-day");
    }
    }, [isAuthenticated]);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const onSubmit = async (data: UserRegisterRequest) => {
        try{
            const response = await registerUser(data).unwrap();
            const { email, expires_at } = response;
            navigate('/users/confirm', { state: { email, expires_at } });
        } catch (error) {
            console.error('Failed to Register', error);
            // handle error received explicitly
            toast("Error Registering: Please Try Again", {type: "error"});
        }
    };

    let formContent: ReactNode = (
        <>
            <TextField
                label="Name"
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
            />
            <TextField
                label="Email"
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
                fullWidth
            />
            <FormControl  variant="outlined" fullWidth>
                                <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                                <OutlinedInput
                                    id="outlined-adornment-password"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register("password", {
                                        onChange: () => {
                                        trigger("confirm_password");
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
                                    label="Password"
                                />
                {errors.password && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.password.message}
                    </Typography>
                )}
                            </FormControl>
            <FormControl  variant="outlined" fullWidth>
                                <InputLabel htmlFor="outlined-adornment-confirm-password">Confirm Password</InputLabel>
                                <OutlinedInput
                                    id="outlined-adornment-confirm-password"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register("confirm_password")}
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
                                    label="Confirm Password"
                                />
                {errors.confirm_password && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.confirm_password.message}
                    </Typography>
                )}
                            </FormControl>
            <Button type='submit' variant='contained' color='primary' fullWidth disabled={isLoading} loading={isLoading}>Register</Button>
        </>
    );

    return (
    <Box className="register-container" sx={{ display: 'flex', minHeight: '100vh' }}>
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, bgcolor: '#f5f5f5', p: 4, alignItems: 'center' }}>
            <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                OPENCOURSE ACADEMY
            </Typography>
        </Box>

        <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ alignSelf: 'flex-end', mb: 4 }}>
                Already have an account?{' '}
                <Link component="button" onClick={() => navigate("/login")} sx={{ fontWeight: 'bold', color: 'inherit' }}>
                    Login
                </Link>
            </Typography>

            <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, gap: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
                    Register Your Account
                </Typography>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
                        {formContent}
                    </Box>
                </form>
            </Box>
        </Box>
    </Box>
    );
};