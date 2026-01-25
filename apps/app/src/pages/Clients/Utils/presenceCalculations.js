import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns"

export const isPresent = (status) => {
    // Compat:
    // - attendance: "present" | "absent" | "late" | "justified"
    // - legacy numeric: 0 = presente
    if (status === null || status === undefined) return false;
    const n = Number(status);
    if (!Number.isNaN(n)) return n === 0;
    const s = String(status).toLowerCase();
    return s === "present";
};

/**
 * Calcula presenças previstas vs realizadas para um mês e comparação com mês anterior
 * @param {Array} presences - Array de presenças com activityDate e status
 * @param {Date} referenceDate - Data de referência (padrão: hoje)
 * @returns {Object} { current, previous, comparison }
 */
export const calculatePresenceStats = (presences = [], referenceDate = new Date()) => {
    const current = calculateMonthStats(presences, referenceDate);
    const previous = calculateMonthStats(presences, subMonths(referenceDate, 1));
    const comparison = {
        attended: current.attended - previous.attended,
        attendedPercent: previous.attended > 0
            ? ((current.attended - previous.attended) / previous.attended) * 100
            : 0,
        frequency: current.frequency - previous.frequency,
    };

    return { current, previous, comparison };
};

export const calculateClientPresenceCardStats = ({ presences = [], enrollments = [] } = {}, referenceDate = new Date()) => {
    const currentMonth = calculateMonthStats(presences, referenceDate);
    const previousMonth = calculateMonthStats(presences, subMonths(referenceDate, 1));

    const current = {
        ...currentMonth,
    };

    const previous = {
        ...previousMonth,
    };

    const comparison = {
        attended: current.attended - previous.attended,
        expected: current.expected - previous.expected,
        frequency: current.frequency - previous.frequency,
    };

    return { current, previous, comparison };
};

/**
 * Calcula estatísticas de presença para um mês específico
 * @param {Array} presences 
 * @param {Date} monthDate 
 * @returns {Object} { expected, attended, frequency, monthLabel }
 */
export const calculateMonthStats = (presences, monthDate) => {
    // Validate date to avoid crashes
    if (!monthDate || isNaN(new Date(monthDate).getTime())) {
        return {
            expected: 0,
            attended: 0,
            frequency: 0,
            monthLabel: 'Data Inválida',
            monthStart: new Date(),
            monthEnd: new Date(),
            presences: []
        };
    }

    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    // Filtra presenças do mês
    const monthPresences = presences.filter(p => {
        const date = new Date(p.activityDate || p.sessionDate || p.date);
        return !isNaN(date) && isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

    // Considera apenas registros efetivos (presente/falta/justificado) para o cálculo
    const effectiveDetails = monthPresences.filter(p => {
        const s = (p.status || "").toLowerCase();
        return ["present", "absent", "late", "justified", "0", "1"].includes(s);
    });

    // Presenças realizadas (status === 0 ou "present")
    const attended = effectiveDetails.filter(p => isPresent(p.status)).length;

    // Total de registros efetivos (Presente + Falta)
    const expected = effectiveDetails.length;

    // Frequência (percentual de presença)
    const frequency = expected > 0 ? (attended / expected) * 100 : 0;

    // Label do mês para exibição - Using toLocaleDateString is safer than date-fns format with fragile locale imports
    let monthLabel = "";
    try {
        monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    } catch (e) {
        console.warn('Error formatting date', e);
        monthLabel = "Mês Inválido";
    }

    return {
        expected,
        attended,
        frequency,
        monthLabel,
        monthStart,
        monthEnd,
        presences: monthPresences
    };
};
