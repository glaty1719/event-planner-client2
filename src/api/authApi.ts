import { http } from "../utils/http.ts";
import { config } from "../config.ts";
import type { ApiResponse } from "../types/response.ts";
import type {
    LoginResponseData,
    PasswordUpdateRequest,
    PasswordUpdateResponse,
    RefreshResponseData,
    RegisterResponseData,
    SendConfirmationCodeRequest,
    UserConfirmationRequest,
    UserLoginRequest,
    UserRegisterRequest
} from "../types/auth.ts";

export const authApi = {
    async login(data: UserLoginRequest): Promise<LoginResponseData> {
        const response = await http.post<ApiResponse<LoginResponseData>>(config.endpoints.login, data);
        return response.data.data;
    },

    async logout(): Promise<{ success: boolean }> {
        const response = await http.post<ApiResponse<{ success: boolean }>>(config.endpoints.logout);
        return response.data.data;
    },

    async register(data: UserRegisterRequest): Promise<RegisterResponseData> {
        const response = await http.post<ApiResponse<RegisterResponseData>>(config.endpoints.register, data);
        return response.data.data;
    },

    async refresh(): Promise<RefreshResponseData> {
        const response = await http.post<ApiResponse<RefreshResponseData>>(config.endpoints.refresh);
        return response.data.data;
    },

    async confirm(data: UserConfirmationRequest): Promise<{ success: boolean }> {
        const response = await http.post<ApiResponse<{ success: boolean }>>(config.endpoints.confirm, data);
        return response.data.data;
    },

    async resendConfirmationCode(data: SendConfirmationCodeRequest): Promise<RegisterResponseData> {
        const response = await http.post<ApiResponse<RegisterResponseData>>(
            config.endpoints.resendConfirmationCode,
            data
        );
        return response.data.data;
    },

    async updatePassword(data: PasswordUpdateRequest): Promise<PasswordUpdateResponse> {
        const response = await http.patch<ApiResponse<PasswordUpdateResponse>>(
            config.endpoints.updatePassword,
            data
        );
        return response.data.data;
    },
};
