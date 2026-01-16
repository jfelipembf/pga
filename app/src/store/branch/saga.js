import { call, put, takeLatest } from "redux-saga/effects";
import { FETCH_BRANCHES_REQUEST } from "./actionTypes";
import { fetchBranchesFailure, fetchBranchesSuccess } from "./actions";
import { listBranchesForUser } from "../../modules/tenants/tenants.db";
import { pickActiveBranch } from "../../modules/tenants/tenants.domain";
import { getFirebaseBackend } from "../../helpers/firebase_helper";
import { seedDefaultRoles } from "../../modules/roles/roles.seed";

function* fetchBranches({ payload }) {
  try {
    const { idTenant, uid, branchSlug } = payload;
    const { branches, membership } = yield call(listBranchesForUser, {
      idTenant,
      uid,
      branchSlug,
      requireMembership: true,
    });

    const storedidBranch = localStorage.getItem("idBranch");
    const activeBranch = pickActiveBranch({ branches, branchSlug, storedidBranch });

    if (activeBranch) {
      const activeId = activeBranch.idBranch || activeBranch.id;
      const activeSlug = activeBranch.slug || activeId;
      localStorage.setItem("idBranch", activeId);
      localStorage.setItem("branchSlug", activeSlug);
    }

    // Seed default roles para branches novas (best effort)
    // Seed default roles para branches novas (best effort, só se não houver cargos)
    try {
      if (activeBranch && branches && branches.length === 1) {
        yield call(seedDefaultRoles, { idTenant, idBranch: activeBranch.idBranch || activeBranch.id });
      }
    } catch (seedError) {
      // silencioso: não bloquear fluxo se seed falhar
    }

    yield put(
      fetchBranchesSuccess({
        branches,
        activeBranch: activeBranch || null,
        membership,
      })
    );
  } catch (error) {
    // se não tiver acesso, limpar sessão e forçar reauth
    const backend = getFirebaseBackend();
    try {
      if (backend && backend.logout) {
        yield call(backend.logout);
      }
    } catch (e) {
      // ignore logout errors
    }
    localStorage.removeItem("authUser");
    console.error("[branchSaga] erro", error);
    yield put(fetchBranchesFailure(error?.message || "Erro ao buscar branches"));
  }
}

export default function* branchSaga() {
  yield takeLatest(FETCH_BRANCHES_REQUEST, fetchBranches);
}
