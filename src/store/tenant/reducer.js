import {
    SET_ACTIVE_TENANT,
    SET_ACTIVE_BRANCH,
    GET_BRANCHES_SUCCESS,
    GET_BRANCHES_FAIL,
    GET_BRANCHES,
    GET_TENANT_DETAILS,
    GET_TENANT_DETAILS_SUCCESS,
    GET_TENANT_DETAILS_FAIL,
    GET_BRANCH_DETAILS,
    GET_BRANCH_DETAILS_SUCCESS,
    GET_BRANCH_DETAILS_FAIL
} from "./actionTypes"
import { LOGIN_SUCCESS } from "../auth/login/actionTypes"

const INIT_STATE = {
    activeTenant: null,
    activeBranch: null,
    branches: [],
    loading: false,
    error: null
}

const TenantReducer = (state = INIT_STATE, action) => {
    switch (action.type) {
        case GET_TENANT_DETAILS:
        case GET_BRANCH_DETAILS:
        case GET_BRANCHES:
            return { ...state, loading: true }
        case GET_TENANT_DETAILS_SUCCESS:
            return {
                ...state,
                activeTenant: { ...state.activeTenant, ...action.payload },
                loading: false
            }
        case GET_BRANCHES_SUCCESS:
            const branches = action.payload;
            let currentActiveBranch = state.activeBranch;
            if (currentActiveBranch && branches.length > 0) {
                const matched = branches.find(b => b.idBranch === currentActiveBranch.idBranch);
                if (matched) currentActiveBranch = matched;
            }
            return {
                ...state,
                branches: branches,
                activeBranch: currentActiveBranch,
                loading: false
            }
        case GET_BRANCH_DETAILS_SUCCESS:
            return {
                ...state,
                activeBranch: { ...state.activeBranch, ...action.payload },
                loading: false
            }
        case GET_TENANT_DETAILS_FAIL:
        case GET_BRANCH_DETAILS_FAIL:
        case GET_BRANCHES_FAIL:
            return { ...state, error: action.payload, loading: false }
        case SET_ACTIVE_TENANT:
            return {
                ...state,
                activeTenant: action.payload
            }
        case SET_ACTIVE_BRANCH:
            return {
                ...state,
                activeBranch: action.payload
            }
        case LOGIN_SUCCESS:
            return {
                ...state,
                activeTenant: {
                    idTenant: action.payload.idTenant,
                    name: action.payload.tenantName || 'Tenant Ativo'
                },
                activeBranch: {
                    idBranch: action.payload.idBranch,
                    name: action.payload.branchName || 'Unidade Ativa'
                }
            }
        default:
            return state
    }
}

export default TenantReducer
