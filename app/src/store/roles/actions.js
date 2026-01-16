import {
  FETCH_ROLES_REQUEST,
  FETCH_ROLES_SUCCESS,
  FETCH_ROLES_FAILURE,
  FETCH_ROLE_REQUEST,
  FETCH_ROLE_SUCCESS,
  FETCH_ROLE_FAILURE,
  CREATE_ROLE_REQUEST,
  CREATE_ROLE_SUCCESS,
  CREATE_ROLE_FAILURE,
  UPDATE_ROLE_REQUEST,
  UPDATE_ROLE_SUCCESS,
  UPDATE_ROLE_FAILURE,
  DELETE_ROLE_REQUEST,
  DELETE_ROLE_SUCCESS,
  DELETE_ROLE_FAILURE,
} from "./actionTypes";

export const fetchRolesRequest = (payload) => ({
  type: FETCH_ROLES_REQUEST,
  payload,
});

export const fetchRolesSuccess = (roles) => ({
  type: FETCH_ROLES_SUCCESS,
  payload: roles,
});

export const fetchRolesFailure = (error) => ({
  type: FETCH_ROLES_FAILURE,
  payload: error,
});

export const fetchRoleRequest = (payload) => ({
  type: FETCH_ROLE_REQUEST,
  payload,
});

export const fetchRoleSuccess = (role) => ({
  type: FETCH_ROLE_SUCCESS,
  payload: role,
});

export const fetchRoleFailure = (error) => ({
  type: FETCH_ROLE_FAILURE,
  payload: error,
});

export const createRoleRequest = (payload) => ({
  type: CREATE_ROLE_REQUEST,
  payload,
});

export const createRoleSuccess = (role) => ({
  type: CREATE_ROLE_SUCCESS,
  payload: role,
});

export const createRoleFailure = (error) => ({
  type: CREATE_ROLE_FAILURE,
  payload: error,
});

export const updateRoleRequest = (payload) => ({
  type: UPDATE_ROLE_REQUEST,
  payload,
});

export const updateRoleSuccess = (role) => ({
  type: UPDATE_ROLE_SUCCESS,
  payload: role,
});

export const updateRoleFailure = (error) => ({
  type: UPDATE_ROLE_FAILURE,
  payload: error,
});

export const deleteRoleRequest = (payload) => ({
  type: DELETE_ROLE_REQUEST,
  payload,
});

export const deleteRoleSuccess = (roleId) => ({
  type: DELETE_ROLE_SUCCESS,
  payload: roleId,
});

export const deleteRoleFailure = (error) => ({
  type: DELETE_ROLE_FAILURE,
  payload: error,
});
