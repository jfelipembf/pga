import { testResultRepository } from '../../data/repositories/TestResultRepository'
import { TestResultSchema } from '../../data/schemas/Events/TestResultSchema'
import { AuditService } from '../Core/AuditService'
import { clientRepository } from '../../data/repositories/ClientRepository'
import moment from 'moment'

/**
 * Serviço para Gestão de Resultados de Testes/Provas
 */
export const TestResultService = {
    /**
     * Registra ou atualiza um resultado de teste
     */
    registerResult: async (idTenant, idBranch, user, data) => {
        // 1. Validar entrada
        const validData = await TestResultSchema.validate(data, { abortEarly: false, stripUnknown: true })

        // 2. Buscar Dados do Aluno para Desnormalização (EFICIÊNCIA)
        const student = await clientRepository.findById(idTenant, idBranch, validData.idStudent)
        if (!student) throw new Error("Estudante não encontrado para registro do teste.")

        const studentMeta = {
            studentName: student.name,
            studentGender: student.gender || 'unspecified',
            studentBirthDate: student.birthDate || null,
        }

        // 3. Verificar se já existe resultado para este par aluno+atividade no ciclo atual
        const existing = await testResultRepository.findByStudentActivityEvent(
            idTenant, idBranch,
            validData.idStudent,
            validData.idActivity,
            validData.idEvent
        )

        if (existing) {
            // Edição
            const updatePayload = {
                ...validData,
                ...studentMeta,
                updatedBy: user.uid,
                updatedAt: new Date()
            }
            await testResultRepository.update(idTenant, idBranch, existing.id, updatePayload)

            await AuditService.log({
                idTenant, idBranch,
                userId: user.uid,
                userName: user.displayName || user.email,
                action: 'TEST_RESULT_UPDATED',
                entityType: 'test_result',
                entityId: existing.id,
                description: `Teste atualizado: ${student.name} no ciclo ${validData.idEvent}`,
                details: { result: validData.resultTime || validData.resultDistance }
            })

            return { id: existing.id, ...updatePayload, isUpdate: true }
        }

        // Criação
        const payload = {
            ...validData,
            ...studentMeta,
            createdBy: user.uid,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const result = await testResultRepository.create(idTenant, idBranch, payload)

        await AuditService.log({
            idTenant, idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            action: 'TEST_RESULT_CREATED',
            entityType: 'test_result',
            entityId: result.id,
            description: `Novo teste registrado: ${student.name} no ciclo ${payload.idEvent}`,
            details: { result: payload.resultTime || payload.resultDistance }
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
     * Gera o Ranking de um evento de forma eficiente
     * Processa em memória para permitir filtros dinâmicos de categoria
     */
    getRanking: async (idTenant, idBranch, idEvent, measureType) => {
        const results = await testResultRepository.findByEvent(idTenant, idBranch, idEvent)

        // Converter tempos em segundos para ordenação se for tipo 'distance' (mede tempo)
        const parseTimeToSeconds = (timeStr) => {
            if (!timeStr) return 999999
            const parts = String(timeStr).split(':').reverse()
            let seconds = 0
            if (parts[0]) seconds += parseInt(parts[0]) // ss
            if (parts[1]) seconds += parseInt(parts[1]) * 60 // mm
            if (parts[2]) seconds += parseInt(parts[2]) * 3600 // hh
            return seconds
        }

        const ranking = results.map(r => {
            const birthDate = r.studentBirthDate ? (r.studentBirthDate.toDate ? r.studentBirthDate.toDate() : new Date(r.studentBirthDate)) : null
            const age = birthDate ? moment().diff(birthDate, 'years') : 0

            // Categoria (Pode ser estendido no futuro)
            let category = "Geral"

            const isDistanceMetric = ['fixed-time', 'distance'].includes(measureType)

            return {
                id: r.id,
                clientName: r.studentName,
                gender: r.studentGender,
                age: age,
                category: category,
                result: isDistanceMetric ? r.resultDistance : r.resultTime,
                testType: isDistanceMetric ? 'distancia' : 'tempo', // Nome para exibição
                sortValue: isDistanceMetric ? parseFloat(r.resultDistance || 0) : parseTimeToSeconds(r.resultTime)
            }
        })

        // Ordenação Global
        // Se tipo Distance (fixed-time): Maior distância ganha (DESC)
        // Se tipo Time (fixed-distance): Menor tempo ganha (ASC)
        ranking.sort((a, b) => {
            const isDistanceMetric = ['fixed-time', 'distance'].includes(measureType)
            if (isDistanceMetric) return b.sortValue - a.sortValue
            return a.sortValue - b.sortValue
        })

        return ranking
    }
}
