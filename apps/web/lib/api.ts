import axios, { AxiosError, AxiosInstance } from "axios"

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("user")

      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)
