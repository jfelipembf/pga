import { useMemo } from 'react';

/**
 * Hook centralizado para acesso aos dados do usuário autenticado.
 * Abstrai a leitura do localStorage e previne erros de parse.
 * 
 * @returns {Object|null} Objeto do usuário (uid, email, displayName, etc) ou null se não autenticado.
 */
export const useCurrentUser = () => {
    const user = useMemo(() => {
        try {
            const authUser = localStorage.getItem("authUser");
            if (!authUser) return null;

            return JSON.parse(authUser);
        } catch (error) {
            console.error("Erro ao ler authUser do localStorage:", error);
            return null;
        }
    }, []);

    return user;
};
