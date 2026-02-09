import { createSelector } from 'reselect'

/**
 * AUTH SELECTORS
 * 
 * Seletores memoizados para acesso ao estado de autenticação.
 * Usa reselect para evitar re-renders desnecessários.
 */

// Seletor base - retorna o slice de login
const selectLoginState = (state) => state.Login

/**
 * Retorna o usuário logado
 */
export const selectUser = createSelector(
    [selectLoginState],
    (login) => login.user
)

/**
 * Retorna as permissões do usuário (memoizado)
 */
export const selectUserPermissions = createSelector(
    [selectUser],
    (user) => user?.permissions || {}
)

/**
 * Retorna a role do usuário
 */
export const selectUserRole = createSelector(
    [selectUser],
    (user) => (user?.role || user?.roleId || '').toLowerCase()
)

/**
 * Retorna se o usuário está autenticado
 */
export const selectIsAuthenticated = createSelector(
    [selectUser],
    (user) => !!user
)

/**
 * Retorna se o usuário é owner (acesso total)
 * Verifica tanto a flag permissions.all quanto os roles conhecidos
 */
export const selectIsOwner = createSelector(
    [selectUserPermissions, selectUserRole],
    (permissions, role) => {
        // Flag explícita de owner
        if (permissions?.all === true) return true
        // Roles conhecidas de owner
        const ownerRoles = ['owner', 'proprietario', 'proprietário']
        return ownerRoles.includes(role)
    }
)

/**
 * Retorna se está carregando
 */
export const selectAuthLoading = createSelector(
    [selectLoginState],
    (login) => login.loading
)

/**
 * Retorna o erro de autenticação
 */
export const selectAuthError = createSelector(
    [selectLoginState],
    (login) => login.error
)

/**
 * Retorna se o usuário fez logout
 */
export const selectIsUserLogout = createSelector(
    [selectLoginState],
    (login) => login.isUserLogout
)
