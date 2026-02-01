import { call, put, takeEvery, takeLatest } from "redux-saga/effects";

// Login Redux States
import { LOGIN_USER, LOGOUT_USER, SOCIAL_LOGIN } from "./actionTypes";
import { apiError, loginSuccess, logoutUserSuccess } from "./actions";

//Include Firebase Helper
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import { staffRepository } from "../../../data/repositories/StaffRepository";
import { tenantRepository } from "../../../data/repositories/TenantRepository";

const fireBaseBackend = getFirebaseBackend();

function* loginUser({ payload: { user, history } }) {
  try {
    const { email, password, idTenant, idBranch } = user;

    // 1. Authenticate with Firebase Auth
    const authResponse = yield call(
      fireBaseBackend.loginUser,
      email,
      password
    );

    // 2. Resolve Tenant and Branch IDs
    const resolvedTenantId = yield call([tenantRepository, tenantRepository.resolveTenantId], idTenant);
    if (!resolvedTenantId) {
      yield put(apiError("Unidade/Tenant inválido."));
      return;
    }

    const resolvedBranchId = yield call([tenantRepository, tenantRepository.resolveBranchId], resolvedTenantId, idBranch);
    if (!resolvedBranchId) {
      yield put(apiError("Filial inválida."));
      return;
    }

    // 3. Fetch Staff Profile from the specific Branch
    const staffProfile = yield call(
      [staffRepository, staffRepository.findByUid],
      resolvedTenantId,
      resolvedBranchId,
      authResponse.uid
    );

    if (!staffProfile) {
      yield put(apiError("Usuário não encontrado nesta unidade ou sem permissão de acesso."));
      return;
    }

    // 4. Validate Status and Role
    if (staffProfile.status !== 'active') {
      yield put(apiError("Sua conta está inativa. Entre em contato com o administrador."));
      return;
    }

    // You can add more role-based checks here if necessary
    // if (staffProfile.role !== 'owner' && staffProfile.role !== 'admin') { ... }

    // 5. Success - Store unified user object
    const finalUser = {
      ...authResponse,
      ...staffProfile,
      // Store resolved IDs to keep consistency but URL might keep using slugs
      idTenant: resolvedTenantId,
      idBranch: resolvedBranchId,
      tenantSlug: idTenant,
      branchSlug: idBranch
    };

    localStorage.setItem("authUser", JSON.stringify(finalUser));
    yield put(loginSuccess(finalUser));

    // 6. Redirect to Multitenant Dashboard
    // Use original parameters (idTenant, idBranch) to keep the URL friendly (slugs) if desired, 
    // OR use resolved IDs. Usually, you want to keep the URL as the user typed if it's valid.
    history(`/${idTenant}/${idBranch}/dashboard`);

  } catch (error) {
    yield put(apiError(error));
  }
}

function* logoutUser({ payload: { history, idTenant, idBranch } }) {
  try {
    const authUser = localStorage.getItem("authUser");
    let redirectUrl = '/login';

    if (idTenant && idBranch) {
      redirectUrl = `/${idTenant}/${idBranch}/login`;
    } else if (authUser) {
      const user = JSON.parse(authUser);
      if (user.tenantSlug && user.branchSlug) {
        redirectUrl = `/${user.tenantSlug}/${user.branchSlug}/login`;
      } else if (user.idTenant && user.idBranch) {
        redirectUrl = `/${user.idTenant}/${user.idBranch}/login`;
      }
    }

    localStorage.removeItem("authUser");
    const response = yield call(fireBaseBackend.logout);
    yield put(logoutUserSuccess(response));

    // Redirect to context-aware login or default
    history(redirectUrl);
  } catch (error) {
    yield put(apiError(error));
  }
}

function* socialLogin({ payload: { data, history } }) {
  try {
    const { type, idTenant, idBranch } = data;
    const authResponse = yield call(fireBaseBackend.socialLoginUser, type);

    if (authResponse) {
      const resolvedTenantId = yield call([tenantRepository, tenantRepository.resolveTenantId], idTenant);
      if (!resolvedTenantId) {
        yield put(apiError("Unidade/Tenant inválido."));
        return;
      }
      const resolvedBranchId = yield call([tenantRepository, tenantRepository.resolveBranchId], resolvedTenantId, idBranch);
      if (!resolvedBranchId) {
        yield put(apiError("Filial inválida."));
        return;
      }

      // Fetch Staff Profile (consistent with email login)
      const staffProfile = yield call(
        [staffRepository, staffRepository.findByUid],
        resolvedTenantId,
        resolvedBranchId,
        authResponse.uid
      );

      if (!staffProfile) {
        yield put(apiError("Usuário não cadastrado nesta unidade."));
        return;
      }

      const finalUser = {
        ...authResponse,
        ...staffProfile,
        idTenant: resolvedTenantId,
        idBranch: resolvedBranchId,
        tenantSlug: idTenant,
        branchSlug: idBranch
      };

      localStorage.setItem("authUser", JSON.stringify(finalUser));
      yield put(loginSuccess(finalUser));
      history(`/${idTenant}/${idBranch}/dashboard`);
    }
  } catch (error) {
    yield put(apiError(error));
  }
}

function* authSaga() {
  yield takeEvery(LOGIN_USER, loginUser);
  yield takeLatest(SOCIAL_LOGIN, socialLogin);
  yield takeEvery(LOGOUT_USER, logoutUser);
}

export default authSaga;
