import { call, put, takeLatest } from "redux-saga/effects";
import { FETCH_PERMISSIONS_REQUEST } from "./actionTypes";
import { fetchPermissionsFailure, fetchPermissionsSuccess } from "./actions";
import { fetchUserPermissions } from "../../modules/permissions/permissions.db";

function* fetchPermissions({ payload }) {
  try {
    const result = yield call(fetchUserPermissions, payload);
    yield put(fetchPermissionsSuccess(result));
  } catch (error) {
    yield put(fetchPermissionsFailure(error?.message || "Erro ao buscar permissões"));
  }
}

export default function* permissionsSaga() {
  yield takeLatest(FETCH_PERMISSIONS_REQUEST, fetchPermissions);
}
