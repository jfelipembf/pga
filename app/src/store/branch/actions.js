import {
  FETCH_BRANCHES_REQUEST,
  FETCH_BRANCHES_SUCCESS,
  FETCH_BRANCHES_FAILURE,
  SET_ACTIVE_BRANCH,
  RESET_BRANCH,
} from "./actionTypes";

export const fetchBranchesRequest = (params) => ({
  type: FETCH_BRANCHES_REQUEST,
  payload: params,
});

export const fetchBranchesSuccess = (payload) => ({
  type: FETCH_BRANCHES_SUCCESS,
  payload,
});

export const fetchBranchesFailure = (error) => ({
  type: FETCH_BRANCHES_FAILURE,
  payload: error,
});

export const setActiveBranch = (branch) => ({
  type: SET_ACTIVE_BRANCH,
  payload: branch,
});

export const resetBranch = () => ({
  type: RESET_BRANCH,
});
