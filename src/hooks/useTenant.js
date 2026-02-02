import { useParams } from 'react-router-dom';
import { useMemo } from 'react';

/**
 * Hook centralizado para resolução do Contexto do Tenant (Unidade/Filial).
 * 
 * PROBLEMA RESOLVIDO:
 * Garante consistência entre a URL e o Usuário Autenticado.
 * Previne que componentes acessem dados em paths incorretos (ex: slug 'a2' vs ID real 'rfu...').
 * 
 * USO:
 * Em vez de const { idTenant } = useParams(), use:
 * const { idTenant, idBranch } = useTenant();
 */
export const useTenant = () => {
    // 1. Tenta pegar da URL (pode ser slug ou ID real)
    const params = useParams();

    // 2. Tenta pegar do Usuário Autenticado (ID Real, Fonte da Verdade de segurança)
    const userJson = localStorage.getItem('authUser');
    const user = userJson ? JSON.parse(userJson) : null;

    return useMemo(() => {
        // IDs para Data Fetching (Prioriza ID Real do Auth)
        const tenantId = user?.idTenant || params.idTenant;
        const branchId = user?.idBranch || params.idBranch;

        // Slugs para Navegação (Prioriza Slug do Auth, fallback para params)
        // Se na URL tiver 'a2', params.idTenant é 'a2'.
        // O user.tenantSlug deve ser 'a2' também.
        const tSlug = user?.tenantSlug || params.idTenant || tenantId;
        const bSlug = user?.branchSlug || params.idBranch || branchId;

        return {
            idTenant: tenantId,
            idBranch: branchId,
            // Adicionando Slugs para links amigáveis
            tenantSlug: tSlug,
            branchSlug: bSlug,
            // Flags úteis
            isReady: !!(tenantId && branchId),
            user: user
        };
    }, [params.idTenant, params.idBranch, user?.idTenant, user?.idBranch]);
};
