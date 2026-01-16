import {
  FETCH_ROLES_REQUEST,
  FETCH_ROLES_SUCCESS,
  FETCH_ROLES_FAILURE,
  FETCH_ROLE_REQUEST,
  FETCH_ROLE_SUCCESS,
  FETCH_ROLE_FAILURE,
  CREATE_ROLE_SUCCESS,
  UPDATE_ROLE_SUCCESS,
  DELETE_ROLE_SUCCESS,
} from "./actionTypes";

const initialState = {
  list: [],
  current: null,
  status: "idle",
  error: null,
};

const roles = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ROLES_REQUEST:
    case FETCH_ROLE_REQUEST:
      return {
        ...state,
        status: "loading",
        error: null,
      };
    case FETCH_ROLES_SUCCESS:
      return {
        ...state,
        status: "succeeded",
        list: action.payload || [],
        error: null,
      };
    case FETCH_ROLE_SUCCESS:
      return {
        ...state,
        status: "succeeded",
        current: action.payload,
        error: null,
      };
    case CREATE_ROLE_SUCCESS:
      return {
        ...state,
        list: [...state.list, action.payload],
        status: "succeeded",
      };
    case UPDATE_ROLE_SUCCESS:
      return {
        ...state,
        list: state.list.map((role) =>
          role.id === action.payload.id ? action.payload : role
        ),
        status: "succeeded",
      };
    case DELETE_ROLE_SUCCESS:
      return {
        ...state,
        list: state.list.filter((role) => role.id !== action.payload),
        status: "succeeded",
      };
    case FETCH_ROLES_FAILURE:
    case FETCH_ROLE_FAILURE:
      return {
        ...state,
        status: "failed",
        error: action.payload,
      };
    default:
      return state;
  }
};

export default roles;
