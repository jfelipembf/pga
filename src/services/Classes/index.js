/**
 * Classes Domain - Gerenciamento de Turmas, Sessões e Presença
 * 
 * Estrutura:
 * - ClassService: Gestão de turmas (grade de horários)
 * - SessionService: Gestão de sessões individuais (aulas)
 * - AttendanceService: Controle de presença
 */

// Serviços principais
export { ClassService } from './ClassService'
export { SessionService } from './SessionService'
export { AttendanceService } from './AttendanceService'

// ===============================================
// WRAPPER LEGADO - Manter para compatibilidade
// ===============================================
import { ClassService } from './ClassService'

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

export const listSessions = async (idTenant, idBranch) => {
    return await ClassService.listAll(idTenant, idBranch)
}
