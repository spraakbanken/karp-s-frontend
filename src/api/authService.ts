import axios from 'axios'
import { ref } from 'vue'
import { jwtDecode } from 'jwt-decode'
import { axiosInstance } from '@/api/apiService'
import { lexicalStore } from '@/stores/store'

/**
 * API base URL for authentication.
 */
export const apiAuth = import.meta.env.VITE_API_AUTH as string

/**
 * Reactive state to track authentication status and store user information.
 */
const isAuthenticated = ref(false)
const user = ref(null)

/**
 * Interface for the JWT payload structure.
 */
interface Scope {
  other: {
    [key: string]: number // Any additional resources can be represented by string keys
  }
  corpora: {
    [key: string]: number // Any additional corpora can be represented by string keys
  }
  lexica: {
    [key: string]: number // Any additional lexica can be represented by string keys
  }
}

interface Levels {
  READ: number
  WRITE: number
  ADMIN: number
}

interface JwtPayload {
  iss: string
  iat: number
  exp: number
  jti: string
  idp: string
  sub: string
  name: string
  email: string
  country: string // Assuming country can be an empty string
  organization: string // Assuming organization can be an empty string
  affiliation: string
  scope: Scope
  levels: Levels
}

/**
 * Sets the JWT token in localStorage and configures Axios with the token.
 * @param jwt - The JWT token to be stored and used for authentication.
 */
const setJwtToken = (jwt: string): void => {
  console.log('setJwtToken() - start ')

  const lexicalStorage = lexicalStore()

  localStorage.setItem('jwt', jwt)
  //axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${jwt}`
  // update list of restricted datasets the user has been granted access to
  const jwtd = jwtDecode<JwtPayload>(jwt)
  const jwt_lexica = jwtd.scope?.lexica
  if (jwt_lexica !== null) {
    lexicalStorage.grantedDatasets = Object.entries(jwt_lexica)
      .filter(([, value]) => value > 0)
      .map(([key]) => key)
  }
  console.log('Granted: ', lexicalStorage.grantedDatasets)
  console.log('setJwtToken() - end ')
}

/**
 * Checks if the provided JWT token is expired.
 * @param jwt - The JWT token to check.
 * @returns `true` if the token is expired, `false` otherwise.
 */
const isJwtExpired = (jwt: string): boolean => {
  console.log('isJwtExpired() - start ')

  try {
    const decoded = jwtDecode<JwtPayload>(jwt)
    const now = Date.now() / 1000 // Current time in seconds
    console.log('isJwtExpired() - end1')
    return decoded.exp < now
  } catch (error) {
    console.error('Error decoding JWT:', error)
    console.log('isJwtExpired() - end2')
    return true
  }
}

/**
 * Validates the JWT token stored in localStorage.
 * If valid, sets the Axios authorization header and updates the authentication state.
 * If invalid, removes the token and clears the authentication state.
 */
const checkJwtToken = (): void => {
  console.log('checkJwtToken() - start ')

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
  console.log('checkJwtToken() - end ', isAuthenticated.value)
}

/**
 * Tests if the user is logged in by making a request to the authentication endpoint.
 * If successful, sets the JWT token and updates the authentication state.
 * @returns A promise that resolves to `true` if authenticated, `false` otherwise.
 */
const testForLogin = async () => {
  console.log('testForLogin() - start ')
  try {
    // https://sp.spraakbanken.gu.se/auth/jwt

    // TODO test
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
  console.log('testForLogin() - end')
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
