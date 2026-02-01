import {
    SET_ACTIVE_TENANT,
    SET_ACTIVE_BRANCH,
    GET_BRANCHES,
    GET_BRANCHES_SUCCESS,
    GET_BRANCHES_FAIL,
    GET_TENANT_DETAILS,
    GET_TENANT_DETAILS_SUCCESS,
    GET_TENANT_DETAILS_FAIL,
    GET_BRANCH_DETAILS,
    GET_BRANCH_DETAILS_SUCCESS,
    GET_BRANCH_DETAILS_FAIL
} from "./actionTypes"

export const setActiveTenant = tenant => ({
    type: SET_ACTIVE_TENANT,
    payload: tenant,
})

export const setActiveBranch = branch => ({
    type: SET_ACTIVE_BRANCH,
    payload: branch,
})

export const getBranches = idTenant => ({
    type: GET_BRANCHES,
    payload: idTenant,
})

export const getBranchesSuccess = branches => ({
    type: GET_BRANCHES_SUCCESS,
    payload: branches,
})

export const getBranchesFail = error => ({
    type: GET_BRANCHES_FAIL,
    payload: error,
})

export const getTenantDetails = idTenant => ({
    type: GET_TENANT_DETAILS,
    payload: idTenant,
})

export const getTenantDetailsSuccess = tenant => ({
    type: GET_TENANT_DETAILS_SUCCESS,
    payload: tenant,
})

export const getTenantDetailsFail = error => ({
    type: GET_TENANT_DETAILS_FAIL,
    payload: error,
})

export const getBranchDetails = (idTenant, idBranch) => ({
    type: GET_BRANCH_DETAILS,
    payload: { idTenant, idBranch },
})

export const getBranchDetailsSuccess = branch => ({
    type: GET_BRANCH_DETAILS_SUCCESS,
    payload: branch,
})

export const getBranchDetailsFail = error => ({
    type: GET_BRANCH_DETAILS_FAIL,
    payload: error,
})
