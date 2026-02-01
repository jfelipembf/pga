import { call, put, takeEvery, all, fork } from "redux-saga/effects"

// Tenant Redux States
import { GET_BRANCHES, GET_TENANT_DETAILS, GET_BRANCH_DETAILS } from "./actionTypes"
import {
    getBranchesSuccess,
    getBranchesFail,
    getTenantDetailsSuccess,
    getTenantDetailsFail,
    getBranchDetailsSuccess,
    getBranchDetailsFail,
} from "./actions"

// Include Repository
import { tenantRepository } from "../../data/repositories/TenantRepository"

function* fetchTenantDetails({ payload: slugOrId }) {
    try {
        const idTenant = yield call([tenantRepository, tenantRepository.resolveTenantId], slugOrId)
        if (!idTenant) {
            yield put(getTenantDetailsFail("Tenant não encontrado"))
            return
        }

        const response = yield call([tenantRepository, tenantRepository.findTenantById], idTenant)
        if (response) {
            yield put(getTenantDetailsSuccess(response))
        } else {
            yield put(getTenantDetailsFail("Tenant não encontrado"))
        }
    } catch (error) {
        yield put(getTenantDetailsFail(error))
    }
}

function* fetchBranchDetails({ payload: { idTenant: tenantSlug, idBranch: branchSlug } }) {
    try {
        const idTenant = yield call([tenantRepository, tenantRepository.resolveTenantId], tenantSlug)
        if (!idTenant) {
            yield put(getBranchDetailsFail("Tenant não encontrado para buscar branch"))
            return
        }

        const idBranch = yield call([tenantRepository, tenantRepository.resolveBranchId], idTenant, branchSlug)
        if (!idBranch) {
            yield put(getBranchDetailsFail("Branch não encontrada"))
            return
        }

        const response = yield call([tenantRepository, tenantRepository.findBranchById], idTenant, idBranch)
        if (response) {
            yield put(getBranchDetailsSuccess(response))
        } else {
            yield put(getBranchDetailsFail("Unidade não encontrada"))
        }
    } catch (error) {
        yield put(getBranchDetailsFail(error))
    }
}

function* fetchBranches({ payload: slugOrId }) {
    try {
        const idTenant = yield call([tenantRepository, tenantRepository.resolveTenantId], slugOrId)
        if (!idTenant) return

        const response = yield call([tenantRepository, tenantRepository.findBranches], idTenant)
        yield put(getBranchesSuccess(response))
    } catch (error) {
        yield put(getBranchesFail(error))
    }
}

export function* watchFetchTenantDetails() {
    yield takeEvery(GET_TENANT_DETAILS, fetchTenantDetails)
}

export function* watchFetchBranchDetails() {
    yield takeEvery(GET_BRANCH_DETAILS, fetchBranchDetails)
}

export function* watchFetchBranches() {
    yield takeEvery(GET_BRANCHES, fetchBranches)
}

function* tenantSaga() {
    yield all([
        fork(watchFetchTenantDetails),
        fork(watchFetchBranchDetails),
        fork(watchFetchBranches),
    ])
}

export default tenantSaga
