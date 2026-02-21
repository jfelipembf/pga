import { staffRepository } from '../../data/repositories/StaffRepository'
import { StaffAuditLogger } from './audit/StaffAuditLogger'
import { StaffRules } from './domain/StaffRules'
import { StaffSchema } from '../../data/schemas/Admin/StaffSchema'
import { initializeApp, deleteApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { firebaseConfig } from "../../helpers/firebase_config"
import { normalizeDate } from '../../utils/date'

/**
 * Serviço para Gestão de Colaboradores (Staff)
 */
export const StaffService = {
    /**
     * Cria um novo colaborador (Auth + Firestore)
     */
    createStaff: async (idTenant, idBranch, userId, staffData) => {
        await StaffSchema.validate(staffData, { abortEarly: false })

        let secondaryApp = null
        try {
            const appName = `SecondaryApp_${Date.now()}`
            secondaryApp = initializeApp(firebaseConfig, appName)
            const secondaryAuth = getAuth(secondaryApp)

            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                staffData.email,
                staffData.password
            )
            const staffUid = userCredential.user.uid

            const payload = StaffRules.buildCreationPayload(staffData, userId)

            const newStaff = await staffRepository.set(idTenant, idBranch, staffUid, payload)

            await StaffAuditLogger.logCreation({
                idTenant, idBranch, userId,
                userName: staffData.createdByUserName || 'Sistema',
                entityId: staffUid,
                staffName: staffData.name,
                email: staffData.email,
                roleName: staffData.roleName,
                roleId: staffData.roleId
            })

            return newStaff
        } catch (error) {
            console.error("Erro ao criar colaborador:", error)
            throw error
        } finally {
            if (secondaryApp) {
                await deleteApp(secondaryApp)
            }
        }
    },

    /**
     * Lista todos os colaboradores
     */
    listAll: async (idTenant, idBranch) => {
        const data = await staffRepository.findAll(idTenant, idBranch)
        return data.filter(s => !s.deletedAt)
    },

    /**
     * Lista colaboradores com filtros
     */
    listWithFilters: async (idTenant, idBranch, filters = {}) => {
        const whereClauses = []

        if (filters.status && filters.status !== 'all') {
            whereClauses.push(['status', '==', filters.status])
        }

        if (filters.isActive !== undefined) {
            whereClauses.push(['isActive', '==', filters.isActive])
        }

        if (filters.roleId) {
            whereClauses.push(['roleId', '==', filters.roleId])
        }

        if (filters.areaId) {
            whereClauses.push(['areaId', '==', filters.areaId])
        }

        const rawData = await staffRepository.findWhere(
            idTenant,
            idBranch,
            whereClauses,
            { field: 'name', direction: 'asc' }
        )

        return rawData.filter(s => !s.deletedAt)
    },

    /**
     * Busca colaborador por ID
     */
    findById: async (idTenant, idBranch, id) => {
        return await staffRepository.findById(idTenant, idBranch, id)
    },

    /**
     * Atualiza um colaborador
     */
    updateStaff: async (idTenant, idBranch, userId, id, data) => {
        const oldData = await staffRepository.findById(idTenant, idBranch, id)

        const result = await staffRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedBy: userId,
            updatedAt: normalizeDate(new Date())
        })

        await StaffAuditLogger.logUpdate({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityId: id,
            oldData,
            newData: data
        })

        return result
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deleteStaff: async (idTenant, idBranch, userId, id) => {
        const staff = await staffRepository.findById(idTenant, idBranch, id)
        StaffRules.validateForDeletion(staff)

        const result = await staffRepository.softDelete(idTenant, idBranch, id, userId)

        await StaffAuditLogger.logDeletion({
            idTenant, idBranch, userId,
            entityId: id,
            staffName: staff.name,
            snapshot: staff
        })

        return result
    },

    /**
     * Altera a senha de um colaborador via Cloud Function
     */
    updatePassword: async (userId, targetUid, newPassword) => {
        const { getFunctions, httpsCallable } = await import("firebase/functions")
        const functions = getFunctions()
        const updateUserPassword = httpsCallable(functions, 'updateUserPassword')

        const result = await updateUserPassword({ uid: targetUid, newPassword })

        return result
    }
}
