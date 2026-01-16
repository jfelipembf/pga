import { RESET_TENANT_CONTEXT, SET_TENANT_CONTEXT, SET_TENANT_ROLES } from "./actionTypes"

export const setTenantContext = ({ tenant, branch, roles = [] }) => ({
  type: SET_TENANT_CONTEXT,
  payload: { tenant, branch, roles },
})

export const clearTenantContext = () => ({
  type: RESET_TENANT_CONTEXT,
})

export const setTenantRoles = roles => ({
  type: SET_TENANT_ROLES,
  payload: roles || [],
})
