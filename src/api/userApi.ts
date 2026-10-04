import { http } from "../utils/http.ts";
import { config } from "../config.ts";
import type { ApiResponse } from "../types/response.ts";
import type { UpdateUserRequest, User } from "../types/user.ts";

export const userApi = {
    async getMe(): Promise<User> {
        const response = await http.get<ApiResponse<User>>(config.endpoints.me);
        return response.data.data;
    },

    async updateMe(data: UpdateUserRequest): Promise<User> {
        const response = await http.patch<ApiResponse<User>>(config.endpoints.me, data);
        return response.data.data;
    },

    async getSignature(): Promise<string> {
        const response = await http.post<ApiResponse<string>>(config.endpoints.cloudinarySignature);
        return response.data.data;
    },
};
