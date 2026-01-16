import { DEFAULT_ROLES } from "../pages/Admin/Roles/Constants/rolesDefaults";

/**
 * Utilitários para verificação de permissões e cargos (RBAC)
 */

/**
 * Obtém os dados do usuário autenticado do localStorage
 */
export const getAuthUser = () => {
    const authUser = localStorage.getItem("authUser");
    if (authUser) {
        return JSON.parse(authUser);
    }
    return null;
};

/**
 * Verifica se o usuário atual é o proprietário (Owner)
 */
export const isOwner = () => {
    const user = getAuthUser();
    // O cargo pode estar em user.role (objeto ou string) ou user.staff.role
    const role = user?.role || user?.staff?.role;

    if (typeof role === 'string') {
        const rLower = role.toLowerCase();
        return rLower === "owner" || rLower === "proprietário";
    }

    return role?.id === "owner" || role?.label?.toLowerCase() === "proprietário";
};

/**
 * Verifica se o usuário tem uma permissão específica
 * @param {string} permissionId - ID da permissão (ex: 'members_manage')
 * @returns {boolean}
 */
export const hasPermission = (permissionId) => {
    const user = getAuthUser();
    if (!user) return false;

    // 1. Proprietário sempre tem permissão
    if (isOwner()) return true;

    // 2. Tenta obter as permissões do objeto do usuário
    let permissions = user?.staff?.permissions || user?.role?.permissions || user?.staff?.role?.permissions;

    // 3. Fallback: Se não encontrou as permissões no usuário, tenta buscar nos DEFAULT_ROLES pelo nome do cargo
    if (!permissions || Object.keys(permissions).length === 0) {
        const staffRole = user?.staff?.role;
        const roleLabel = typeof staffRole === 'string' ? staffRole : staffRole?.label;

        if (roleLabel) {
            const defaultRole = DEFAULT_ROLES.find(r =>
                r.label.toLowerCase() === roleLabel.toLowerCase() ||
                r.id.toLowerCase() === roleLabel.toLowerCase()
            );
            permissions = defaultRole?.permissions;
        }
    }

    return !!permissions?.[permissionId];
};

/**
 * Verifica se o usuário tem pelo menos uma das permissões da lista
 * @param {string[]} permissionIds 
 */
export const hasAnyPermission = (permissionIds = []) => {
    if (isOwner()) return true;
    if (!permissionIds || permissionIds.length === 0) return true;
    return permissionIds.some(id => hasPermission(id));
};

/**
 * Verifica se o usuário tem todas as permissões da lista
 * @param {string[]} permissionIds 
 */
export const hasAllPermissions = (permissionIds = []) => {
    if (isOwner()) return true;
    return permissionIds.every(id => hasPermission(id));
};
