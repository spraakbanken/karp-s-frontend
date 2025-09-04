import axios, { type AxiosInstance } from 'axios'

const apiAuth = import.meta.env.VITE_API_AUTH as string

const axiosInstance: AxiosInstance = axios.create({
  baseURL: apiAuth,
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    } else {
      delete config.headers['Authorization']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle 401 error: redirect to login or logout
      console.error('401 Unauthorized error:', error)
      window.location.href = '/'
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
