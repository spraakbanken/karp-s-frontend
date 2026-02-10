import axios from 'axios'
import { ref } from 'vue'
import { jwtDecode } from 'jwt-decode'
import { axiosInstance } from '@/api/apiService'

/**
 * API base URL for authentication.
 */
export const apiAuth = import.meta.env.VITE_API_AUTH as string

/**
 * Reactive state to track authentication status ans store user information.
 */
const isAuthenticated = ref(false)
const user = ref(null)

/**
 * Interface for the JWT payload structure.
 */
interface JwtPayload {
  exp: number
}

/**
 * Sets the JWT token in localStorage and configures Axios with the token.
 * @param jwt - The JWT token to be stored and used for authentication.
 */
const setJwtToken = (jwt: string): void => {
  localStorage.setItem('jwt', jwt)
  //axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${jwt}`
}

/**
 * Checks if the provided JWT token is expired.
 * @param jwt - The JWT token to check.
 * @returns `true` if the token is expired, `false` otherwise.
 */
const isJwtExpired = (jwt: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(jwt)
    const now = Date.now() / 1000 // Current time in seconds
    return decoded.exp < now
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return true
  }
}

/**
 * Validates the JWT token stored in localStorage.
 * If valid, sets the Axios authorization header and updates the authentication state.
 * If invalid, removes the token and clears the authentication state.
 */
const checkJwtToken = (): void => {
  const jwt = localStorage.getItem('jwt')
  if (jwt && !isJwtExpired(jwt)) {
    //axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${jwt}`
    isAuthenticated.value = true
  } else {
    localStorage.removeItem('jwt')
    delete axiosInstance.defaults.headers.common['Authorization']
    isAuthenticated.value = false
  }
}

/**
 * Tests if the user is logged in by making a request to the authentication endpoint.
 * If successful, sets the JWT token and updates the authentication state.
 * @returns A promise that resolves to `true` if authenticated, `false` otherwise.
 */
const testForLogin = async () => {
  try {
    // https://sp.spraakbanken.gu.se/auth/jwt
    const response = await axios.get(`${apiAuth}/jwt`, {
      responseType: 'text',
      withCredentials: true,
      timeout: 2_000,
    })

    if (response.data) {
      setJwtToken(response.data)
      isAuthenticated.value = true
    } else {
      delete axios.defaults.headers.common['Authorization']
      isAuthenticated.value = false
    }

    return isAuthenticated.value
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      isAuthenticated.value = false
      return false
    } else {
      // console.error('Login error:', error)
      // throw error
    }
  }
}

/**
 * Logs the user out by clearing the JWT token, resetting the authentication state,
 * and redirecting to the logout URL.
 */
const logout = (): void => {
  localStorage.removeItem('jwt')
  delete axios.defaults.headers.common['Authorization']
  isAuthenticated.value = false
  user.value = null
  window.location.href = `https://sp.spraakbanken.gu.se/Shibboleth.sso/Logout`
}

// Check the JWT token on initialization to set the authentication state.
checkJwtToken()

export { isAuthenticated, user, testForLogin, logout, checkJwtToken }
