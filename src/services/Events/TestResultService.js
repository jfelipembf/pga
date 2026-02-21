import { testResultRepository } from '../../data/repositories/TestResultRepository'
import { TestResultSchema } from '../../data/schemas/Events/TestResultSchema'
import { TestResultAuditLogger } from './audit/TestResultAuditLogger'
import { TestResultRules } from './domain/TestResultRules'
import { clientRepository } from '../../data/repositories/ClientRepository'
import { normalizeDate } from '../../utils/date'

/**
 * Serviço para Gestão de Resultados de Testes/Provas
 */
export const TestResultService = {
    /**
     * Registra ou atualiza um resultado de teste
     */
    registerResult: async (idTenant, idBranch, user, data) => {
        const validData = await TestResultSchema.validate(data, { abortEarly: false, stripUnknown: true })

        const client = await clientRepository.findById(idTenant, idBranch, validData.idClient)
        if (!client) throw new Error("Estudante não encontrado para registro do teste.")

        const clientMeta = TestResultRules.buildClientMeta(client)

        // Verificar se já existe resultado
        const existing = await testResultRepository.findByClientActivityEvent(
            idTenant, idBranch,
            validData.idClient,
            validData.idActivity,
            validData.idEvent
        )

        if (existing) {
            const updatePayload = {
                ...validData,
                ...clientMeta,
                updatedBy: user.uid,
                updatedAt: normalizeDate(new Date())
            }
            await testResultRepository.update(idTenant, idBranch, existing.id, updatePayload)

            await TestResultAuditLogger.logUpdate({
                idTenant, idBranch,
                userId: user.uid,
                userName: user.displayName || user.email,
                entityId: existing.id,
                clientName: client.name,
                idEvent: validData.idEvent,
                result: validData.resultTime || validData.resultDistance
            })

            return { id: existing.id, ...updatePayload, isUpdate: true }
        }

        // Criação
        const payload = {
            ...validData,
            ...clientMeta,
            createdBy: user.uid,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date())
        }

        const result = await testResultRepository.create(idTenant, idBranch, payload)

        await TestResultAuditLogger.logCreation({
            idTenant, idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            entityId: result.id,
            clientName: client.name,
            idEvent: payload.idEvent,
            result: payload.resultTime || payload.resultDistance
        })

        return result
    },

    /**
     * Busca os resultados de um ciclo para uma atividade específica
     */
    getResultsByActivity: async (idTenant, idBranch, idActivity, idEvent) => {
        return await testResultRepository.findWhere(idTenant, idBranch, [
            ['idActivity', '==', idActivity],
            ['idEvent', '==', idEvent],
            ['deletedAt', '==', null]
        ])
    },

    /**
     * Gera o Ranking de um evento
     */
    getRanking: async (idTenant, idBranch, idEvent, measureType) => {
        const results = await testResultRepository.findByEvent(idTenant, idBranch, idEvent)
        return TestResultRules.generateRanking(results, measureType)
    }
}
