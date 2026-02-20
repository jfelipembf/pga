import { AuditService } from '../../../Core/AuditService'

export const ClientContractAuditLogger = {
    logCreation: async ({ idTenant, idBranch, userId, userName, userPhoto, idClientContract, contractData, isFirstContract, salesClassification, previousContractId }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName, userPhoto,
            action: 'CREATE',
            entityType: 'clientContract',
            entityId: idClientContract,
            details: {
                idClient: contractData.idClient,
                planName: contractData.planName,
                isFirstContract,
                salesClassification,
                previousContractId
            },
            description: `Contrato ${contractData.planName} criado [${salesClassification.toUpperCase()}].`
        })
    },

    logSuspension: async ({ idTenant, idBranch, userId, userName, userPhoto, idClientContract, suspensionDays, reason }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName, userPhoto,
            action: 'SUSPEND',
            entityType: 'clientContract',
            entityId: idClientContract,
            details: { suspensionDays, reason }
        })
    },

    logDaysAdjustment: async ({ idTenant, idBranch, userId, userName, userPhoto, idClientContract, days, mode, reason, oldEndDate, newEndDate }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName, userPhoto,
            action: 'CONTRACT_DAYS_ADJUSTED',
            entityType: 'clientContract',
            entityId: idClientContract,
            details: { days, mode, reason, oldEndDate, newEndDate }
        })
    },

    logReactivation: async ({ idTenant, idBranch, userId, userName, userPhoto, idClientContract }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName, userPhoto,
            action: 'REACTIVATE',
            entityType: 'clientContract',
            entityId: idClientContract,
            details: {}
        })
    },

    logCancellation: async ({ idTenant, idBranch, userId, userName, userPhoto, idClientContract, financialData, actualCanceledReceivables }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName, userPhoto,
            action: 'CANCEL',
            entityType: 'clientContract',
            entityId: idClientContract,
            details: {
                ...financialData,
                actualCanceledReceivables
            }
        })
    },

    logScheduledCancellation: async ({ idTenant, idBranch, userId, userName, userPhoto, idClientContract, scheduleData }) => {
        return AuditService.log({
            idTenant, idBranch, userId, userName, userPhoto,
            action: 'SCHEDULE_CANCELLATION',
            entityType: 'clientContract',
            entityId: idClientContract,
            details: scheduleData
        })
    }
}
