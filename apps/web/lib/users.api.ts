import { apiClient } from "./api"
import type { UserProfile, CreateUserDto, UpdateUserDto } from "@/types"

export const usersApi = {
  getAll: async (): Promise<UserProfile[]> => {
    const { data } = await apiClient.get<UserProfile[]>("/users")
    return data
  },

  getOne: async (id: string): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>(`/users/${id}`)
    return data
  },

  create: async (dto: CreateUserDto): Promise<UserProfile> => {
    const { data } = await apiClient.post<UserProfile>("/users", dto)
    return data
  },

  update: async (id: string, dto: UpdateUserDto): Promise<UserProfile> => {
    const { data } = await apiClient.patch<UserProfile>(`/users/${id}`, dto)
    return data
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },
}
