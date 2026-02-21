import { serverTimestamp } from 'firebase/firestore'
import { timeToMinutes } from '../../../utils/date'
import moment from 'moment'

/**
 * Regras de Domínio para Gestão de Turmas e Grades (Class/Grade)
 */
export const ClassRules = {
    /**
     * Calcula a duração em minutos entre dois horários HH:mm
     */
    calculateDuration: (startTime, endTime) => {
        if (!startTime || !endTime) return 0;
        return timeToMinutes(endTime) - timeToMinutes(startTime);
    },

    /**
     * Prepara o payload para criação de uma nova turma na grade
     */
    buildClassCreatePayload: (idTenant, idBranch, userId, formData, weekday) => {
        const durationMinutes = ClassRules.calculateDuration(formData.startTime, formData.endTime);

        return {
            idActivity: formData.idActivity,
            idArea: formData.idArea,
            idStaff: formData.idStaff,
            weekday,
            startTime: formData.startTime,
            endTime: formData.endTime,
            durationMinutes,
            startDate: formData.startDate,
            endDate: formData.endDate || null,
            maxCapacity: formData.maxCapacity,
            isActive: formData.isActive !== false,
            status: 'active',
            idTenant,
            idBranch,
            createdBy: userId,
            updatedBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            deletedAt: null
        };
    },

    /**
     * Determina o limite de data para geração de sessões
     */
    getSessionLimits: (startDate, endDate) => {
        let current = moment(startDate).startOf('day');
        const endLimit = endDate
            ? moment(endDate).endOf('day')
            : moment(startDate).add(6, 'months').endOf('day');

        // Blindagem contra datas no futuro muito distante
        if (endLimit.year() > 2100) endLimit.year(2100);

        return { current, endLimit };
    },

    /**
     * Mapeia quais campos da turma devem ser propagados para as sessões
     */
    getPropagationMapping: () => ({
        idActivity: 'idActivity',
        idArea: 'idArea',
        idStaff: 'idStaff',
        startTime: 'startTime',
        endTime: 'endTime',
        maxCapacity: 'maxCapacity',
        isActive: 'isActive',
        endDate: 'endDate'
    }),

    /**
     * Prepara o payload de atualização de uma turma, calculando deltas
     */
    buildClassUpdatePayload: (userId, data, oldData) => {
        const updateData = {
            ...data,
            updatedBy: userId,
            updatedAt: serverTimestamp()
        };

        if (data.startTime || data.endTime) {
            const start = data.startTime || oldData.startTime;
            const end = data.endTime || oldData.endTime;
            updateData.durationMinutes = ClassRules.calculateDuration(start, end);
        }

        return updateData;
    },

    /**
     * Constrói o payload de propagação para sessões futuras baseado nos campos alterados
     */
    buildSessionPropagationPayload: (userId, data, oldData) => {
        const mapping = ClassRules.getPropagationMapping();
        const changedFields = {};
        let hasChanges = false;

        Object.keys(mapping).forEach(field => {
            const newVal = data[field];
            if (newVal !== undefined && String(newVal || '') !== String(oldData[field] || '')) {
                changedFields[mapping[field]] = newVal;
                hasChanges = true;
            }
        });

        if (hasChanges) {
            if (changedFields.startTime || changedFields.endTime) {
                const s = changedFields.startTime || oldData.startTime;
                const e = changedFields.endTime || oldData.endTime;
                changedFields.durationMinutes = ClassRules.calculateDuration(s, e);
            }
            changedFields.updatedBy = userId;
            changedFields.updatedAt = serverTimestamp();
            return changedFields;
        }

        return null;
    },

    /**
     * Payload padrão para Soft Delete (Turma ou Sessão)
     */
    buildSoftDeletePayload: (userId, status = 'deleted') => {
        return {
            deletedAt: serverTimestamp(),
            deletedBy: userId,
            status: status,
            isActive: false,
            updatedBy: userId,
            updatedAt: serverTimestamp()
        };
    }
};
