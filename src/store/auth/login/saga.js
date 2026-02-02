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
    // FIX: Nome correto do método é resolveTenantId
    const resolvedidTenant = yield call([tenantRepository, tenantRepository.resolveTenantId], idTenant);
    if (!resolvedidTenant) {
      yield put(apiError("Unidade/Tenant inválido."));
      return;
    }

    const resolvedBranchId = yield call([tenantRepository, tenantRepository.resolveBranchId], resolvedidTenant, idBranch);
    if (!resolvedBranchId) {
      yield put(apiError("Filial inválida."));
      return;
    }

    // 3. Fetch Staff Profile from the specific Branch
    const staffProfile = yield call(
      [staffRepository, staffRepository.findByUid],
      resolvedidTenant,
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

    // Fetch Slugs for URL consistency (Crucial for Friendly URLs)
    let finalTenantSlug = idTenant; // Assume input was slug
    let finalBranchSlug = idBranch; // Assume input was slug

    // Verify if inputs were actually IDs, if so, fetch slugs
    if (finalTenantSlug === resolvedidTenant) {
      const tenantData = yield call([tenantRepository, tenantRepository.findTenantById], resolvedidTenant);
      finalTenantSlug = tenantData?.slug || resolvedidTenant;
    }

    if (finalBranchSlug === resolvedBranchId) {
      const branchData = yield call([tenantRepository, tenantRepository.findBranchById], resolvedidTenant, resolvedBranchId);
      finalBranchSlug = branchData?.slug || resolvedBranchId;
    }

    // 5. Success - Store unified user object
    const finalUser = {
      ...authResponse,
      ...staffProfile,
      // Store resolved IDs to keep consistency but URL might keep using slugs
      idTenant: resolvedidTenant,
      idBranch: resolvedBranchId,
      tenantSlug: finalTenantSlug,
      branchSlug: finalBranchSlug,
      // Unificação de Dados de Exibição
      displayName: staffProfile.name || (staffProfile.firstName ? `${staffProfile.firstName} ${staffProfile.lastName || ''}`.trim() : null) || authResponse.displayName || authResponse.email,
      photoURL: staffProfile.photo || staffProfile.avatar || authResponse.photoURL || null,
      firstName: staffProfile.firstName || null,
      lastName: staffProfile.lastName || null,
      role: staffProfile.role || 'user'
    };

    localStorage.setItem("authUser", JSON.stringify(finalUser));
    yield put(loginSuccess(finalUser));

    // 6. Redirect to Multitenant Dashboard
    // Use Friendly Slugs for URL
    history(`/${finalTenantSlug}/${finalBranchSlug}/dashboard`);

  } catch (error) {
    yield put(apiError(error));
  }
}

function* logoutUser({ payload: { history, idTenant, idBranch } }) {
  try {
    const authUser = localStorage.getItem("authUser");
    let redirectUrl = '/login';

    if (idTenant && idBranch) {
      // Tenta manter o contexto atual se passado
      redirectUrl = `/${idTenant}/${idBranch}/login`;
    } else if (authUser) {
      const user = JSON.parse(authUser);
      // Prefere slugs para URL
      if (user.tenantSlug && user.branchSlug) {
        redirectUrl = `/${user.tenantSlug}/${user.branchSlug}/login`;
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
      const resolvedidTenant = yield call([tenantRepository, tenantRepository.resolveTenantId], idTenant);
      if (!resolvedidTenant) {
        yield put(apiError("Unidade/Tenant inválido."));
        return;
      }
      const resolvedBranchId = yield call([tenantRepository, tenantRepository.resolveBranchId], resolvedidTenant, idBranch);
      if (!resolvedBranchId) {
        yield put(apiError("Filial inválida."));
        return;
      }

      // Fetch Staff Profile (consistent with email login)
      const staffProfile = yield call(
        [staffRepository, staffRepository.findByUid],
        resolvedidTenant,
        resolvedBranchId,
        authResponse.uid
      );

      if (!staffProfile) {
        yield put(apiError("Usuário não cadastrado nesta unidade."));
        return;
      }

      // Fetch Slugs (Simplified here, ideally repeat the check from loginUser)
      const tenantData = yield call([tenantRepository, tenantRepository.findTenantById], resolvedidTenant);
      const branchData = yield call([tenantRepository, tenantRepository.findBranchById], resolvedidTenant, resolvedBranchId);

      const finalUser = {
        ...authResponse,
        ...staffProfile,
        idTenant: resolvedidTenant,
        idBranch: resolvedBranchId,
        tenantSlug: tenantData?.slug || idTenant,
        branchSlug: branchData?.slug || idBranch
      };

      localStorage.setItem("authUser", JSON.stringify(finalUser));
      yield put(loginSuccess(finalUser));
      history(`/${finalUser.tenantSlug}/${finalUser.branchSlug}/dashboard`);
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
