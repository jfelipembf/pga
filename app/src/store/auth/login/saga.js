import { call, put, takeEvery, takeLatest } from "redux-saga/effects";

// Login Redux States
import { LOGIN_USER, LOGOUT_USER, SOCIAL_LOGIN } from "./actionTypes";
import { apiError, loginSuccess, logoutUserSuccess } from "./actions";

//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  postFakeLogin,
  postJwtLogin,
} from "../../../helpers/fakebackend_helper";
import { hasPermission } from "../../../helpers/permission_helper";

const fireBaseBackend = getFirebaseBackend();

function* loginUser({ payload: { user, history } }) {
  try {
    const { pathname, search } = window.location;
    const pathParts = pathname.split("/").filter(Boolean);
    const maybeTenant = pathParts[0] || null;
    const maybeBranch = pathParts[1] || null;
    const searchParams = new URLSearchParams(search || "");
    const queryTenant = searchParams.get("tenant");
    const queryBranch = searchParams.get("branch");
    const tenantSlug = maybeTenant === "login" ? queryTenant || null : maybeTenant || queryTenant || null;
    const branchSlug = tenantSlug ? (maybeBranch || queryBranch || null) : queryBranch || null;

    // Exigir slug de tenant e unidade; se ausente, não prossegue
    if (!tenantSlug || !branchSlug) {
      const msg = "Use o link completo da academia e unidade para entrar (ex.: /{academia}/{unidade}/login).";
      yield put(apiError(msg));
      return;
    }

    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const response = yield call(
        fireBaseBackend.loginUser,
        user.email,
        user.password
      );

      // Resolver tenant/branch e validar staff
      const db = getFirestore();
      let idTenant = null;
      let idBranch = null;

      const tenantSlugRef = doc(db, "tenantsBySlug", tenantSlug);
      const tenantSlugSnap = yield call(getDoc, tenantSlugRef);
      if (!tenantSlugSnap.exists()) {
        throw new Error("Academia não encontrada para o link informado.");
      }
      idTenant = tenantSlugSnap.data().idTenant;

      const tenantRef = doc(db, "tenants", idTenant);
      const tenantSnap = yield call(getDoc, tenantRef);
      if (!tenantSnap.exists()) {
        throw new Error("Dados da academia não encontrados.");
      }

      const branchesCol = collection(tenantRef, "branches");
      const branchQuery = query(branchesCol, where("slug", "==", branchSlug));
      const branchSnap = yield call(getDocs, branchQuery);
      if (branchSnap.empty) {
        throw new Error("Unidade não encontrada para este link.");
      }
      branchSnap.forEach(docSnap => {
        idBranch = docSnap.id;
      });

      const staffRef = doc(tenantRef, "branches", idBranch, "staff", response.uid);
      const staffSnap = yield call(getDoc, staffRef);

      if (!staffSnap.exists()) {
        yield call(fireBaseBackend.logout);
        throw new Error("Você não tem acesso a esta academia/unidade.");
      }

      const staffData = staffSnap.data();
      const roleId = staffData?.roleId || staffData?.role?.toLowerCase().replace(/\s+/g, "-") || null;
      let roleData = null;

      if (roleId) {
        const roleRef = doc(tenantRef, "branches", idBranch, "roles", roleId);
        const roleSnap = yield call(getDoc, roleRef);
        if (roleSnap.exists()) {
          roleData = { id: roleSnap.id, ...roleSnap.data() };
        }
      }

      const fullNameFromStaff = staffData
        ? [staffData.firstName, staffData.lastName].filter(Boolean).join(" ")
        : null;

      const sessionKey = `session-${tenantSlug || "no-tenant"}-${branchSlug || "no-branch"}`;
      const sessionData = {
        uid: response.uid,
        email: response.email,
        displayName: fullNameFromStaff || response.displayName || response.email,
        photoUrl: staffData?.photoUrl || staffData?.photo || response.photoURL || response.photoUrl || null,
        idTenant,
        idBranch,
        tenantSlug,
        branchSlug,
        role: roleData || staffData?.role || null, // Se achou o objeto, usa ele. Fallback para a string original.
        staff: staffData,
      };
      localStorage.setItem(sessionKey, JSON.stringify(sessionData));
      localStorage.setItem("authUser", JSON.stringify(sessionData));
      localStorage.setItem("idTenant", String(idTenant));
      localStorage.setItem("idBranch", String(idBranch));
      localStorage.setItem("tenantSlug", String(tenantSlug));
      localStorage.setItem("branchSlug", String(branchSlug));

      yield put(loginSuccess(response));
    } else if (process.env.REACT_APP_DEFAULTAUTH === "jwt") {
      const response = yield call(postJwtLogin, {
        email: user.email,
        password: user.password,
      });
      localStorage.setItem("authUser", JSON.stringify(response));
      yield put(loginSuccess(response));
    } else if (process.env.REACT_APP_DEFAULTAUTH === "fake") {
      const response = yield call(postFakeLogin, {
        email: user.email,
        password: user.password,
      });
      localStorage.setItem("authUser", JSON.stringify(response));
      yield put(loginSuccess(response));
    }

    // Decidir o destino padrão baseado em permissões
    const canViewManagement = hasPermission("dashboards_management_view");
    const targetDashboard = canViewManagement ? "dashboard" : "dashboard/operational";

    // Redirecionar mantendo o slug se houver
    if (tenantSlug && branchSlug) {
      history(`/${tenantSlug}/${branchSlug}/${targetDashboard}`);
    } else {
      history(`/${targetDashboard}`);
    }
  } catch (error) {
    const message = typeof error === "string" ? error : error?.message || "Não foi possível entrar.";
    yield put(apiError(message));
  }
}

function* logoutUser({ payload: { history } }) {
  try {
    const storedAuth = localStorage.getItem("authUser");
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        const sessionKey = `session-${parsed?.tenantSlug || "no-tenant"}-${parsed?.branchSlug || "no-branch"}`;
        localStorage.removeItem(sessionKey);
      } catch (e) {
        // ignore JSON parse errors
      }
    }
    localStorage.removeItem("authUser");

    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const response = yield call(fireBaseBackend.logout);
      yield put(logoutUserSuccess(response));
    }
    history('/login');
  } catch (error) {
    yield put(apiError(error?.message || "Erro ao sair."));
  }
}

function* socialLogin({ payload: { type, history } }) {
  try {
    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const fireBaseBackend = getFirebaseBackend();
      const response = yield call(fireBaseBackend.socialLoginUser, type);
      if (response) {
        history("/dashboard");
      } else {
        history("/login");
      }
      localStorage.setItem("authUser", JSON.stringify(response));
      yield put(loginSuccess(response));
    }
    const response = yield call(fireBaseBackend.socialLoginUser, type);
    if (response)
      history("/dashboard");
  } catch (error) {
    yield put(apiError(error?.message || "Não foi possível entrar."));
  }
}

function* authSaga() {
  yield takeEvery(LOGIN_USER, loginUser);
  yield takeLatest(SOCIAL_LOGIN, socialLogin);
  yield takeEvery(LOGOUT_USER, logoutUser);
}

export default authSaga;
