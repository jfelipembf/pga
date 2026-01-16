import { RESET_TENANT_CONTEXT, SET_TENANT_CONTEXT, SET_TENANT_ROLES } from "./actionTypes"

const DEFAULT_ROLES = ["owner", "manager", "collaborator", "viewer"]

const INIT_STATE = {
  tenant: null,
  branch: null,
  roles: DEFAULT_ROLES,
}

const Tenant = (state = INIT_STATE, action) => {
  switch (action.type) {
    case SET_TENANT_CONTEXT: {
      const rolesFromPayload =
        action.payload.roles && action.payload.roles.length
          ? action.payload.roles
          : state.roles

      return {
        ...state,
        tenant: action.payload.tenant || null,
        branch: action.payload.branch || null,
        roles: rolesFromPayload,
      }
    }
    case SET_TENANT_ROLES:
      return {
        ...state,
        roles: action.payload,
      }
    case RESET_TENANT_CONTEXT:
      return {
        ...INIT_STATE,
      }
    default:
      return state
  }
}

export default Tenant
