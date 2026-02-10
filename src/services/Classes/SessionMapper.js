/**
 * Mapper para normalização de dados de Sessões.
 * Centraliza a lógica de como o dado sai do Firebase e chega na UI.
 */
export const SessionMapper = {
    /**
     * Normaliza um único objeto de sessão.
     * Resolve variações de nomes de campos (idStaff vs idInstructor, etc).
     */
    toUI: (s, activeClassIds = null) => {
        // Se fornecido activeClassIds, filtra sessões de turmas deletadas ou inativas
        if (activeClassIds && !activeClassIds.has(s.idClass)) return null;

        return {
            ...s,
            id: s.id || s.idSession,
            idSession: s.idSession || s.id,
            sessionDate: s.sessionDate || s.date || s.activityDate,
            startTime: String(s.startTime || "").trim(),
            endTime: String(s.endTime || "").trim(),
            idActivity: s.idActivity || s.activityId || s.id_activity,
            idArea: s.idArea || s.areaId || s.id_area || s.locationId || s.idLocation,
            idStaff: s.idStaff || s.staffId || s.idInstructor || s.instructorId || s.id_staff,
            weekday: s.weekday !== undefined ? Number(s.weekday) : null,
            deleted: s.deleted || !!s.deletedAt || false,
            isActive: s.isActive !== false,
            status: s.status === 'cancelled' ? 'canceled' : (s.status || 'scheduled'),
            // Garantir valores numéricos
            enrolledCount: Number(s.enrolledCount || 0),
            presentCount: Number(s.presentCount || 0),
            absentCount: Number(s.absentCount || 0)
        }
    },

    /**
     * Normaliza uma lista de sessões para exibição.
     */
    toUIList: (list, activeClassIds = null) => {
        if (!Array.isArray(list)) return [];
        return list
            .map(s => SessionMapper.toUI(s, activeClassIds))
            .filter(s => s !== null && !s.deleted && s.sessionDate && s.startTime);
    }
}
