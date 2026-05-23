import axios, { AxiosError, AxiosInstance } from "axios"

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
})

function deleteCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Clean up all auth state
      localStorage.removeItem("access_token")
      localStorage.removeItem("user")
      deleteCookie("access_token")

      // Redirect with reason so login page can show a toast
      const current = window.location.pathname
      const isLoginPage = current === "/login"
      if (!isLoginPage) {
        window.location.href = `/login?reason=expired&from=${encodeURIComponent(current)}`
      }
    }
    return Promise.reject(error)
  }
)
