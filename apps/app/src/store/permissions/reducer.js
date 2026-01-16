import {
  FETCH_PERMISSIONS_REQUEST,
  FETCH_PERMISSIONS_SUCCESS,
  FETCH_PERMISSIONS_FAILURE,
  RESET_PERMISSIONS,
} from "./actionTypes";

const initialState = {
  permissions: {},
  allowAll: false,
  status: "idle",
  error: null,
  roleId: null,
};

const permissions = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PERMISSIONS_REQUEST:
      return {
        ...state,
        status: "loading",
        error: null,
      };
    case FETCH_PERMISSIONS_SUCCESS:
      return {
        ...state,
        status: "succeeded",
        permissions: action.payload.permissions || {},
        allowAll: Boolean(action.payload.allowAll),
        roleId: action.payload.roleId || null,
        error: null,
      };
    case FETCH_PERMISSIONS_FAILURE:
      return {
        ...state,
        status: "failed",
        error: action.payload,
      };
    case RESET_PERMISSIONS:
      return { ...initialState };
    default:
      return state;
  }
};

export default permissions;
