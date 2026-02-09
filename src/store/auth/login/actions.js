import {
  LOGIN_USER,
  LOGIN_SUCCESS,
  LOGOUT_USER,
  LOGOUT_USER_SUCCESS,
  API_ERROR,
  SOCIAL_LOGIN,
  SET_USER,
  UPDATE_USER_PERMISSIONS,
} from "./actionTypes"

export const loginUser = (user, history) => {
  return {
    type: LOGIN_USER,
    payload: { user, history },
  }
}

export const loginSuccess = user => {
  return {
    type: LOGIN_SUCCESS,
    payload: user,
  }
}

/**
 * Define o usuário no Redux Store.
 * Chamado após login bem-sucedido ou ao restaurar sessão.
 */
export const setUser = (user) => {
  return {
    type: SET_USER,
    payload: user,
  }
}

/**
 * Atualiza apenas as permissões do usuário.
 * Útil quando o cargo é atualizado e queremos refletir imediatamente.
 */
export const updateUserPermissions = (permissions) => {
  return {
    type: UPDATE_USER_PERMISSIONS,
    payload: permissions,
  }
}

export const logoutUser = (history, idTenant, idBranch) => {
  return {
    type: LOGOUT_USER,
    payload: { history, idTenant, idBranch },
  }
}

export const logoutUserSuccess = () => {
  return {
    type: LOGOUT_USER_SUCCESS,
    payload: {},
  }
}

export const apiError = error => {
  return {
    type: API_ERROR,
    payload: error,
  }
}

export const socialLogin = (data, history) => {
  return {
    type: SOCIAL_LOGIN,
    payload: { data, history },
  };
};
