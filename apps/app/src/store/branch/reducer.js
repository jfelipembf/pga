import {
  FETCH_BRANCHES_REQUEST,
  FETCH_BRANCHES_SUCCESS,
  FETCH_BRANCHES_FAILURE,
  SET_ACTIVE_BRANCH,
  RESET_BRANCH,
} from "./actionTypes";

const savedidBranch = localStorage.getItem("idBranch") || localStorage.getItem("branchSlug") || null;

const initialState = {
  idBranch: savedidBranch || null,
  activeBranch: null,
  branches: [],
  billingStatus: null,
  status: savedidBranch ? "prefilled" : "idle",
  error: null,
  membership: null,
};

const branch = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_BRANCHES_REQUEST:
      return {
        ...state,
        status: "loading",
        error: null,
      };
    case FETCH_BRANCHES_SUCCESS: {
      const active = action.payload.activeBranch || null;
      return {
        ...state,
        status: "succeeded",
        branches: action.payload.branches || [],
        activeBranch: active,
        idBranch: active ? active.idBranch || active.id : null,
        billingStatus: active ? active.billingStatus || active.status || null : null,
        membership: action.payload.membership || null,
        error: null,
      };
    }
    case FETCH_BRANCHES_FAILURE:
      return {
        ...state,
        status: "failed",
        error: action.payload,
        idBranch: null,
        activeBranch: null,
        billingStatus: null,
      };
    case SET_ACTIVE_BRANCH:
      return {
        ...state,
        activeBranch: action.payload,
        idBranch: action.payload ? action.payload.idBranch || action.payload.id : null,
        billingStatus: action.payload
          ? action.payload.billingStatus || action.payload.status || null
          : null,
      };
    case RESET_BRANCH:
      return { ...initialState };
    default:
      return state;
  }
};

export default branch;
