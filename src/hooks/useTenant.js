import { useParams } from 'react-router-dom';
import { getFirebaseBackend } from '../helpers/firebase_helper';

/**
 * Hook Centralizado para Resolução de Tenant/Branch.
 * 
 * Este hook é a "Fonte da Verdade" para identificar em qual contexto (Tenant/Filial) 
 * o sistema deve operar.
 * 
 * PROBLEMA RESOLVIDO:
 * A URL contém Slugs (ex: "academia-top"), não necessariamente IDs (ex: "rfu...").
 * Componentes antigos usavam useParams() pegando o slug e usando como ID, causando 
 * duplicação de dados ou acesso a tenants errados (ex: "a2").
 * 
 * SOLUÇÃO:
 * Este hook prioriza o ID do Tenant resolvido e armazenado no token do usuário logado.
 * Se o usuário está logado, sabemos EXATAMENTE qual é o seu Tenant ID real.
 * A URL serve apenas para navegação/estética.
 */
export const useTenant = () => {
    const params = useParams();

    // Tenta obter o backend (pode ser null se não inicializado, mas aqui já deve estar)
    const backend = getFirebaseBackend();
    const user = backend ? backend.getAuthenticatedUser() : null;

    // Lógica de Prioridade:
    // 1. User Logado (Fonte Segura e Resolvida pelo Saga no Login)
    // 2. URL Params (Fallback para páginas públicas ou deep links não autenticados - Risco de usar Slug como ID)

    // Nota: Se user.idTenant existir, ele é o UUID real (ex: "rfu...").
    // params.idTenant é o que está na barra de endereço (ex: "a2").

    const tenantId = user?.idTenant || params.idTenant;
    const branchId = user?.idBranch || params.idBranch;

    return {
        // IDs Reais (para usar em Services/Repositories e Banco de Dados)
        tenantId,
        branchId,

        // Slugs (para display ou construir links de navegação)
        tenantSlug: params.idTenant || user?.tenantSlug,
        branchSlug: params.idBranch || user?.branchSlug,

        // Objeto user completo se necessário
        user
    };
};
