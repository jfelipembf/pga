import { staffRepository } from '../../data/repositories/StaffRepository'
import { AuditService } from '../Audit/AuditService'
import { StaffSchema } from '../../data/schemas/Admin/StaffSchema'
import { initializeApp, deleteApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { firebaseConfig } from "../../helpers/firebase_config"

/**
 * Serviço para Gestão de Colaboradores (Staff)
 */
export const StaffService = {
    /**
     * Cria um novo colaborador (Auth + Firestore)
     */
    createStaff: async (idTenant, idBranch, userId, staffData) => {
        // 1. Validação do Schema
        await StaffSchema.validate(staffData, { abortEarly: false })

        let secondaryApp = null
        try {
            // 2. Inicialização Duplicada para criar usuário sem deslogar o Admin
            const appName = `SecondaryApp_${Date.now()}`
            secondaryApp = initializeApp(firebaseConfig, appName)
            const secondaryAuth = getAuth(secondaryApp)

            // 3. Criar Usuário no Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                staffData.email,
                staffData.password
            )
            const staffUid = userCredential.user.uid

            // 4. Preparar dados para Firestore (Removendo campos sensíveis do payload do banco)
            const { password, confirmPassword, ...dbData } = staffData

            const newStaff = await staffRepository.set(idTenant, idBranch, staffUid, {
                ...dbData,
                isActive: dbData.isActive !== false,
                status: dbData.status || 'active',
                createdBy: userId,
                deletedAt: null
            })

            // 5. Auditoria
            await AuditService.log({
                idTenant, idBranch, userId,
                userName: staffData.createdByUserName || 'Sistema',
                action: 'STAFF_CREATED',
                entityType: 'staff',
                entityId: staffUid,
                description: `Novo colaborador criado: ${staffData.name} (${staffData.roleName || 'Sem cargo'})`,
                details: {
                    email: staffData.email,
                    role: staffData.roleName,
                    roleId: staffData.roleId
                }
            })

            return newStaff
        } catch (error) {
            console.error("Erro ao criar colaborador:", error)
            throw error
        } finally {
            // Limpeza: Deletar a instância secundária
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
        const result = await staffRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: new Date()
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: data.userName,
            action: 'STAFF_UPDATED',
            entityType: 'staff',
            entityId: id,
            description: `Colaborador atualizado: ${data.name || id}`
        })

        return result
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deleteStaff: async (idTenant, idBranch, userId, id) => {
        const staff = await staffRepository.findById(idTenant, idBranch, id)
        if (!staff) throw new Error("Colaborador não encontrado")

        const result = await staffRepository.softDelete(idTenant, idBranch, id, userId)

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'STAFF_DELETED',
            entityType: 'staff',
            entityId: id,
            description: `Colaborador excluído: ${staff.name || id}`
        })

        return result
    }
}
