/**
 * Classes Domain - Gerenciamento de Turmas, Sessões e Presença
 * 
 * Estrutura:
 * - ClassService: Gestão de turmas (grade de horários)
 * - SessionService: Gestão de sessões individuais (aulas)
 * - AttendanceService: Controle de presença
 */

import { ClassService } from './ClassService'
import { SessionService } from './SessionService'
import { AttendanceService } from './AttendanceService'

// Exportação dos serviços principais
export { ClassService, SessionService, AttendanceService }

// ===============================================
// WRAPPER LEGADO - Manter para compatibilidade
// ===============================================

export const listClasses = async (idTenant, idBranch, filters = {}) => {
    return await ClassService.listWithFilters(idTenant, idBranch, filters)
}

export const createClass = async (idTenant, idBranch, userId, classData) => {
    return await ClassService.createClass(idTenant, idBranch, userId, classData)
}

export const updateClass = async (idTenant, idBranch, userId, classId, classData) => {
    return await ClassService.updateClass(idTenant, idBranch, userId, classId, classData)
}

export const deleteClass = async (idTenant, idBranch, userId, classId, userName) => {
    return await ClassService.deleteClass(idTenant, idBranch, userId, classId, userName)
}

export const listSessions = async (idTenant, idBranch, start, end) => {
    if (start && end) {
        return await SessionService.listByDateRange(idTenant, idBranch, start, end)
    }
    return await SessionService.listByDateRange(idTenant, idBranch) // Busca ativa por padrão
}
