import moment from 'moment'
import { normalizeDate } from '../../../utils/date'

/**
 * Regras de Negócio para Resultados de Testes
 */
export const TestResultRules = {
    /**
     * Constrói metadados do cliente para desnormalização
     */
    buildClientMeta: (client) => ({
        clientName: client.name,
        clientGender: client.gender || 'unspecified',
        clientBirthDate: client.birthDate || null,
    }),

    /**
     * Gera ranking a partir dos resultados
     */
    generateRanking: (results, measureType) => {
        const parseTimeToSeconds = (timeStr) => {
            if (!timeStr) return 999999
            const parts = String(timeStr).split(':').reverse()
            let seconds = 0
            if (parts[0]) seconds += parseInt(parts[0])
            if (parts[1]) seconds += parseInt(parts[1]) * 60
            if (parts[2]) seconds += parseInt(parts[2]) * 3600
            return seconds
        }

        const ranking = results.map(r => {
            const birthDate = normalizeDate(r.clientBirthDate)
            const age = birthDate ? moment().diff(birthDate, 'years') : 0

            let category = "Geral"
            const isDistanceMetric = ['fixed-time', 'distance'].includes(measureType)

            return {
                id: r.id,
                clientName: r.clientName,
                gender: r.clientGender,
                age: age,
                category: category,
                result: isDistanceMetric ? r.resultDistance : r.resultTime,
                testType: isDistanceMetric ? 'distancia' : 'tempo',
                sortValue: isDistanceMetric ? parseFloat(r.resultDistance || 0) : parseTimeToSeconds(r.resultTime)
            }
        })

        ranking.sort((a, b) => {
            const isDistanceMetric = ['fixed-time', 'distance'].includes(measureType)
            if (isDistanceMetric) return b.sortValue - a.sortValue
            return a.sortValue - b.sortValue
        })

        return ranking
    }
}
