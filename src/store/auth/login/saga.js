import { call, put, takeEvery, takeLatest } from "redux-saga/effects";

// Login Redux States
import { LOGIN_USER, LOGOUT_USER, SOCIAL_LOGIN } from "./actionTypes";
import { apiError, loginSuccess, logoutUserSuccess } from "./actions";

//Include Firebase Helper
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import { tenantRepository } from "../../../data/repositories/TenantRepository";
import { staffRepository } from "../../../data/repositories/StaffRepository";
import { roleRepository } from "../../../data/repositories/RoleRepository";
import { DEFAULT_ROLES } from "../../../config/permissions";

const fireBaseBackend = getFirebaseBackend();

const resolveRoleKey = (staffProfile) => {
  return (staffProfile?.roleId || staffProfile?.role || staffProfile?.roleName || "").toLowerCase();
};

const isOwnerRole = (roleKey) => roleKey === 'owner' || roleKey === 'proprietario';

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

    // --- FETCH ROLE AND PERMISSIONS ---
    let userPermissions = {};
    const roleId = staffProfile.roleId || staffProfile.role;
    const roleKey = resolveRoleKey(staffProfile);

    if (isOwnerRole(roleKey)) {
      userPermissions = { all: true };
    } else if (roleId) {
      try {
        const roleDoc = yield call(
          [roleRepository, roleRepository.findById],
          resolvedidTenant,
          resolvedBranchId,
          roleId
        );

        if (roleDoc && roleDoc.permissions) {
          userPermissions = roleDoc.permissions;
        } else {
          const fallbackRole = DEFAULT_ROLES.find(r => r.id === roleKey);
          if (fallbackRole?.permissions) {
            userPermissions = fallbackRole.permissions;
          } else {
            console.warn(`[LoginSaga] Role '${roleId}' not found in DB and no fallback permissions found.`);
          }
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    }

    // Merge direct permissions if they exist on the user (overrides role)
    if (staffProfile.permissions) {
      userPermissions = { ...userPermissions, ...staffProfile.permissions };
    }
    // ----------------------------------

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
      permissions: userPermissions, // <--- INJECT PERMISSIONS HERE
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
      role: staffProfile.role || staffProfile.roleId || staffProfile.roleName || 'user'
    };

    console.log("[LoginSaga] Final User stored with permissions:", finalUser.permissions);

    localStorage.setItem("authUser", JSON.stringify(finalUser));
    yield put(loginSuccess(finalUser));

    // 6. Redirect to Operational Dashboard (Accessible to everyone)
    history(`/${finalTenantSlug}/${finalBranchSlug}/dashboard-operational`);

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

      const roleKey = resolveRoleKey(staffProfile);
      const finalUser = {
        ...authResponse,
        ...staffProfile,
        permissions: isOwnerRole(roleKey) ? { all: true } : (staffProfile.permissions || {}),
        idTenant: resolvedidTenant,
        idBranch: resolvedBranchId,
        tenantSlug: tenantData?.slug || idTenant,
        branchSlug: branchData?.slug || idBranch,
        role: staffProfile.role || staffProfile.roleId || staffProfile.roleName || 'user'
      };

      localStorage.setItem("authUser", JSON.stringify(finalUser));
      yield put(loginSuccess(finalUser));
      history(`/${finalUser.tenantSlug}/${finalUser.branchSlug}/dashboard-operational`);
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
