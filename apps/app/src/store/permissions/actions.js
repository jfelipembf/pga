import {
  FETCH_PERMISSIONS_REQUEST,
  FETCH_PERMISSIONS_SUCCESS,
  FETCH_PERMISSIONS_FAILURE,
  RESET_PERMISSIONS,
} from "./actionTypes";

export const fetchPermissionsRequest = (params) => ({
  type: FETCH_PERMISSIONS_REQUEST,
  payload: params,
});

export const fetchPermissionsSuccess = (payload) => ({
  type: FETCH_PERMISSIONS_SUCCESS,
  payload,
});

export const fetchPermissionsFailure = (error) => ({
  type: FETCH_PERMISSIONS_FAILURE,
  payload: error,
});

export const resetPermissions = () => ({
  type: RESET_PERMISSIONS,
});
