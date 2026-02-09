import {
  LOGIN_USER,
  LOGIN_SUCCESS,
  LOGOUT_USER,
  LOGOUT_USER_SUCCESS,
  API_ERROR,
  SET_USER,
  UPDATE_USER_PERMISSIONS,
} from "./actionTypes"

/**
 * Carrega o usuário do localStorage para inicialização do Redux.
 * Isso permite que o app tenha os dados do user ao fazer refresh.
 */
const loadUserFromStorage = () => {
  try {
    const authUser = localStorage.getItem("authUser")
    if (authUser) {
      return JSON.parse(authUser)
    }
  } catch (error) {
    console.error("[Auth Reducer] Erro ao carregar usuário do localStorage:", error)
  }
  return null
}

const initialState = {
  user: loadUserFromStorage(),
  loading: false,
  error: "",
  isUserLogout: false,
}

const login = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_USER:
      return {
        ...state,
        loading: true,
        error: "",
      }

    case LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: "",
        isUserLogout: false,
      }

    case SET_USER:
      return {
        ...state,
        user: action.payload,
      }

    case UPDATE_USER_PERMISSIONS:
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          permissions: action.payload,
        } : null,
      }

    case LOGOUT_USER:
      return {
        ...state,
        loading: true,
      }

    case LOGOUT_USER_SUCCESS:
      return {
        ...state,
        user: null,
        loading: false,
        isUserLogout: true,
      }

    case API_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        isUserLogout: false,
      }

    default:
      return state
  }
}

export default login
