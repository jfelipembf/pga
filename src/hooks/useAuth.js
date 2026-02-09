import { useSelector, useDispatch } from 'react-redux'
import { useMemo, useCallback } from 'react'
import {
    selectUser,
    selectUserPermissions,
    selectIsAuthenticated,
    selectIsOwner,
    selectAuthLoading,
    selectAuthError,
} from '../store/auth/login/selectors'
import { logoutUser, updateUserPermissions } from '../store/auth/login/actions'
import { MENU_STRUCTURE } from '../config/menu'
import {
    hasPermission as checkPermission,
    hasAnyPermission as checkAnyPermission,
    filterMenuByPermissions
} from '../utils/permissionUtils'

/**
 * Hook centralizado para autenticação e permissões.
 * 
 * SUBSTITUIU: useCurrentUser, usePermissions
 * 
 * Uso:
 * const { user, permissions, isOwner, hasPermission, filteredMenu } = useAuth()
 * 
 * @returns {Object} Estado de autenticação e utilitários
 */
export const useAuth = () => {
    const dispatch = useDispatch()

    // Seletores do Redux
    const user = useSelector(selectUser)
    const permissions = useSelector(selectUserPermissions)
    const isAuthenticated = useSelector(selectIsAuthenticated)
    const isOwner = useSelector(selectIsOwner)
    const isLoading = useSelector(selectAuthLoading)
    const error = useSelector(selectAuthError)

    // Menu filtrado pelas permissões (memoizado)
    const filteredMenu = useMemo(() => {
        return filterMenuByPermissions(MENU_STRUCTURE, permissions)
    }, [permissions])

    // Função para verificar permissão específica
    const hasPermission = useCallback((permissionId) => {
        return checkPermission(permissions, permissionId)
    }, [permissions])

    // Função para verificar qualquer permissão de uma lista
    const hasAnyPermission = useCallback((permissionIds) => {
        return checkAnyPermission(permissions, permissionIds)
    }, [permissions])

    // Função para fazer logout
    const logout = useCallback((history, idTenant, idBranch) => {
        dispatch(logoutUser(history, idTenant, idBranch))
    }, [dispatch])

    // Função para atualizar permissões (quando cargo muda)
    const updatePermissions = useCallback((newPermissions) => {
        dispatch(updateUserPermissions(newPermissions))

        // Também atualiza o localStorage para persistência
        try {
            const authUser = localStorage.getItem("authUser")
            if (authUser) {
                const parsed = JSON.parse(authUser)
                parsed.permissions = newPermissions
                localStorage.setItem("authUser", JSON.stringify(parsed))
            }
        } catch (e) {
            console.error("[useAuth] Erro ao atualizar permissões no localStorage:", e)
        }
    }, [dispatch])

    return {
        // Estado do usuário
        user,
        permissions,
        isAuthenticated,
        isOwner,
        isLoading,
        error,

        // Menu filtrado
        filteredMenu,

        // Funções de verificação
        hasPermission,
        hasAnyPermission,

        // Ações
        logout,
        updatePermissions,
    }
}

export default useAuth
