import { call, put, takeLatest } from "redux-saga/effects";
import {
  FETCH_ROLES_REQUEST,
  FETCH_ROLE_REQUEST,
  CREATE_ROLE_REQUEST,
  UPDATE_ROLE_REQUEST,
  DELETE_ROLE_REQUEST,
} from "./actionTypes";
import {
  fetchRolesSuccess,
  fetchRolesFailure,
  fetchRoleSuccess,
  fetchRoleFailure,
  createRoleSuccess,
  createRoleFailure,
  updateRoleSuccess,
  updateRoleFailure,
  deleteRoleSuccess,
  deleteRoleFailure,
} from "./actions";
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from "../../modules/roles/roles.db";
import { toastSuccess, toastError } from "../../helpers/toast";

function* fetchRolesSaga({ payload }) {
  try {
    const roles = yield call(listRoles, payload);
    yield put(fetchRolesSuccess(roles));
  } catch (error) {
    toastError(error?.message || "Erro ao buscar cargos");
    yield put(fetchRolesFailure(error?.message || "Erro ao buscar cargos"));
  }
}

function* fetchRoleSaga({ payload }) {
  try {
    const role = yield call(getRole, payload);
    yield put(fetchRoleSuccess(role));
  } catch (error) {
    toastError(error?.message || "Erro ao buscar cargo");
    yield put(fetchRoleFailure(error?.message || "Erro ao buscar cargo"));
  }
}

function* createRoleSaga({ payload }) {
  try {
    const role = yield call(createRole, payload);
    yield put(createRoleSuccess(role));
    toastSuccess("Cargo criado com sucesso");
  } catch (error) {
    toastError(error?.message || "Erro ao criar cargo");
    yield put(createRoleFailure(error?.message || "Erro ao criar cargo"));
  }
}

function* updateRoleSaga({ payload }) {
  try {
    const role = yield call(updateRole, payload);
    yield put(updateRoleSuccess(role));
    toastSuccess("Cargo atualizado com sucesso");
  } catch (error) {
    toastError(error?.message || "Erro ao atualizar cargo");
    yield put(updateRoleFailure(error?.message || "Erro ao atualizar cargo"));
  }
}

function* deleteRoleSaga({ payload }) {
  try {
    yield call(deleteRole, payload);
    yield put(deleteRoleSuccess(payload.roleId));
    toastSuccess("Cargo excluído com sucesso");
  } catch (error) {
    toastError(error?.message || "Erro ao excluir cargo");
    yield put(deleteRoleFailure(error?.message || "Erro ao excluir cargo"));
  }
}

export default function* rolesSaga() {
  yield takeLatest(FETCH_ROLES_REQUEST, fetchRolesSaga);
  yield takeLatest(FETCH_ROLE_REQUEST, fetchRoleSaga);
  yield takeLatest(CREATE_ROLE_REQUEST, createRoleSaga);
  yield takeLatest(UPDATE_ROLE_REQUEST, updateRoleSaga);
  yield takeLatest(DELETE_ROLE_REQUEST, deleteRoleSaga);
}
