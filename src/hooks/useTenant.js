import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Hook centralizado para resolução do Contexto do Tenant (Unidade/Filial).
 * 
 * Agora Integrado ao REDUX para reatividade instantânea.
 */
export const useTenant = () => {
    // 1. Dados da URL (Fallback e Inicialização)
    const params = useParams();

    // 2. Dados do Redux (Fonte da Verdade Global)
    const { activeTenant, activeBranch } = useSelector(state => state.Tenant);

    // 3. Dados do LocalStorage (Fallback de Segurança/Refresh)
    // Útil se o Redux ainda não hidratou, mas evitamos depender só disso.
    const userJson = localStorage.getItem('authUser');
    const localUser = userJson ? JSON.parse(userJson) : null;

    return useMemo(() => {
        // 1. Normalização
        const normalize = (val) => val ? String(val) : null;

        const paramTenant = normalize(params.idTenant);
        const paramBranch = normalize(params.idBranch);

        // Funcao para verificar se a fonte de dados (Redux ou Local) bate com a URL
        const isMatch = (sourceSlug, urlParam) => {
            if (!urlParam) return true; // Se não tem param na URL, confiamos no estado global
            if (!sourceSlug) return false; // Tem URL mas não tem dado na fonte
            return normalize(sourceSlug) === urlParam;
        };

        // 2. Resolução do Tenant
        let tenantId = null;
        let tSlug = paramTenant; // URL é a fonte da verdade para o slug atual
        let activeTenantObj = null;

        // Tenta Redux (Prioridade Máxima)
        if (activeTenant && isMatch(activeTenant.slug, paramTenant)) {
            tenantId = normalize(activeTenant.idTenant);
            tSlug = activeTenant.slug;
            activeTenantObj = activeTenant;
        }
        // Fallback LocalStorage (Apenas se bater com a URL)
        else if (localUser && isMatch(localUser.tenantSlug, paramTenant)) {
            tenantId = normalize(localUser.idTenant);
            tSlug = localUser.tenantSlug;
            // Não temos o objeto completo do tenant no localUser, apenas IDs/Slugs
        }

        // 3. Resolução da Filial (Branch)
        let branchId = null;
        let bSlug = paramBranch;
        let activeBranchObj = null;

        // Tenta Redux
        if (activeBranch && isMatch(activeBranch.slug, paramBranch)) {
            branchId = normalize(activeBranch.idBranch);
            bSlug = activeBranch.slug;
            activeBranchObj = activeBranch;
        }
        // Fallback LocalStorage
        else if (localUser && isMatch(localUser.branchSlug, paramBranch)) {
            branchId = normalize(localUser.idBranch);
            bSlug = localUser.branchSlug;
        }

        // 4. Verificação Final de Prontidão
        // Só está pronto se encontramos IDs válidos que batem com a navegação atual
        const isReady = !!(tenantId && branchId);

        return {
            idTenant: isReady ? tenantId : null, // Não retorna ID se não estiver pronto/consistente
            idBranch: isReady ? branchId : null,

            // Slugs sempre retornam o da URL (intenção do usuário) ou o resolvido
            tenantSlug: tSlug,
            branchSlug: bSlug,

            tenant: activeTenantObj,
            branch: activeBranchObj,

            isReady
        };
    }, [
        activeTenant,
        activeBranch,
        params.idTenant,
        params.idBranch,
        localUser?.idTenant,
        localUser?.tenantSlug,
        localUser?.idBranch,
        localUser?.branchSlug
    ]);
};
