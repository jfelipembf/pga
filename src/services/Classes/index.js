/**
 * @deprecated Este arquivo é um wrapper legado para compatibilidade.
 * MIGRAÇÃO GRADUAL: Use ClassService diretamente de services/Admin/ClassService
 * 
 * Módulos que ainda usam este wrapper:
 * - Classes page (useClassesPage, useClassFormLogic)
 * - Grade (useGradeData)
 */
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
