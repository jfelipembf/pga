import React, { createContext, useContext, useState, useMemo } from 'react';
import { useGradeData } from '../pages/Grade/Hooks/useGradeData';
import { getStartOfWeek } from '../utils/date';

const GradeContext = createContext();

/**
 * GradeProvider centraliza o estado da Grade de Aulas (Operacional, Matrículas e Planejamento).
 * Mantém a sincronia entre a data de referência, filtros de turno e ocupação, e os dados das sessões.
 */
export const GradeProvider = ({ children }) => {
    // 1. Estados de Navegação e Filtros
    const [referenceDate, setReferenceDate] = useState(new Date());
    const [view, setView] = useState("week"); // week | day
    const [turn, setTurn] = useState("all"); // all | morning | afternoon | night

    // 2. Dados Completos da Grade (Sessions enriquecidas)
    // O hook useGradeData cuida do cache por semana e join com dados estáticos
    const {
        sessions,
        loading,
        refresh,
        setSessions,
        cacheStats
    } = useGradeData(referenceDate);

    // 3. Calculado
    const weekStart = useMemo(() => getStartOfWeek(referenceDate), [referenceDate]);

    // 4. Handlers de Atualização Otimista
    // Centraliza a lógica de manipular o array de sessões para manter as páginas limpas
    const updateAttendanceInSession = (sessionId, attendanceData) => {
        setSessions(prev => (Array.isArray(prev) ? prev : []).map(session => {
            if (String(session.id) === String(sessionId)) {
                return {
                    ...session,
                    attendanceRecorded: true,
                    attendanceSnapshot: attendanceData.clients,
                    presentCount: attendanceData.presentCount,
                    absentCount: attendanceData.absentCount
                };
            }
            return session;
        }));
    };

    const updateEnrollmentCount = (sessionId, action) => {
        setSessions(prev => (Array.isArray(prev) ? prev : []).map(session => {
            if (String(session.id) === String(sessionId)) {
                const currentCount = Number(session.enrolledCount || 0);
                return {
                    ...session,
                    enrolledCount: action === 'remove' ? Math.max(0, currentCount - 1) : currentCount + 1
                };
            }
            return session;
        }));
    };

    const value = {
        // Estado da Grade
        referenceDate,
        setReferenceDate,
        view,
        setView,
        turn,
        setTurn,

        // Dados e Status
        sessions,
        setSessions,
        loading,
        refresh,
        weekStart,
        cacheStats,

        // Funções de Negócio (Otimistas)
        updateAttendanceInSession,
        updateEnrollmentCount
    };

    return (
        <GradeContext.Provider value={value}>
            {children}
        </GradeContext.Provider>
    );
};

export const useGrade = () => {
    const context = useContext(GradeContext);
    if (!context) {
        // Se precisar usar fora do context, ele apenas avisará (útil se quisermos fallback)
        console.warn('useGrade being used outside of GradeProvider. Session data might be unavailable.');
        return {};
    }
    return context;
};
