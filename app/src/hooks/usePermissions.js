import { useState, useEffect, useCallback } from 'react';
import {
    getAuthUser,
    isOwner,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
} from '../helpers/permission_helper';

/**
 * Hook para acessar permissões do usuário em componentes funcionais
 */
export const usePermissions = () => {
    const [user, setUser] = useState(getAuthUser());

    // Atualiza quando o localStorage mudar (útil para login/logout ou troca de unidade)
    useEffect(() => {
        const handleStorageChange = () => {
            setUser(getAuthUser());
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const isOwnerFunc = useCallback(() => isOwner(), []);
    const hasPermissionFunc = useCallback((id) => hasPermission(id), []);
    const hasAnyPermissionFunc = useCallback((ids) => hasAnyPermission(ids), []);
    const hasAllPermissionsFunc = useCallback((ids) => hasAllPermissions(ids), []);

    return {
        user,
        isOwner: isOwnerFunc,
        hasPermission: hasPermissionFunc,
        hasAnyPermission: hasAnyPermissionFunc,
        hasAllPermissions: hasAllPermissionsFunc,
        role: user?.role || user?.staff?.role
    };
};

export default usePermissions;
