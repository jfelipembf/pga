import { useGrade } from "../../../contexts/GradeContext";
import { useStaticData } from "../../../contexts/StaticDataContext";

/**
 * Hook para centralizar os dados da página de Avaliação.
 * Agora consome o GradeContext para aproveitar o cache de sessões e o StaticDataContext para dados fixos.
 */
export const useEvaluationData = (referenceDate) => {
    // 1. Obtém dados da Grade (Sessões enriquecidas e status de carregamento)
    // Nota: O GradeContext já faz o fetch das sessões baseado na referenceDate global.
    const {
        sessions,
        loading: isLoadingGrade,
        refresh
    } = useGrade();

    // 2. Obtém dados estáticos (Atividades, Áreas, Staff)
    const {
        activities,
        areas,
        staff,
        isLoading: isLoadingStatic
    } = useStaticData();

    return {
        sessions,
        activities,
        areas,
        staff,
        // Mantemos a interface para não quebrar o index.js
        isLoading: isLoadingGrade || isLoadingStatic,
        refresh
    };
};
