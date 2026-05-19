import { apiClient } from "./api"
import type { AuthResponse, LoginDto, RegisterDto } from "@/types"

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", dto)
    return data
  },

  register: async (dto: RegisterDto): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/register", dto)
    return data
  },

  getProfile: async () => {
    const { data } = await apiClient.get("/auth/profile")
    return data
  },
}
