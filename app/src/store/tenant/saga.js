import { call, put, takeLatest } from "redux-saga/effects";
import { FETCH_TENANT_REQUEST } from "./actionTypes";
import { fetchTenantFailure, fetchTenantSuccess } from "./actions";
import { resolveTenantBySlug } from "../../modules/tenants/tenants.db";

function* fetchTenant({ payload }) {
  try {
    const tenant = yield call(resolveTenantBySlug, payload.slug);
    yield put(fetchTenantSuccess(tenant));
  } catch (error) {
    yield put(fetchTenantFailure(error?.message || "Erro ao buscar tenant"));
  }
}

export default function* tenantSaga() {
  yield takeLatest(FETCH_TENANT_REQUEST, fetchTenant);
}
