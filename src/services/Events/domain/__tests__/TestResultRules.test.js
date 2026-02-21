// Mock do moment e normalizeDate ANTES do import
jest.mock('moment', () => {
    const mMoment = {
        diff: jest.fn(() => 25), // sempre retorna 25 anos
        format: jest.fn(() => '2025-01-01'),
    }
    const momentFn = jest.fn(() => mMoment)
    momentFn.default = momentFn
    return momentFn
})

jest.mock('../../../../utils/date', () => ({
    normalizeDate: jest.fn((d) => d)
}))

import { TestResultRules } from '../TestResultRules'

describe('TestResultRules', () => {

    // ========================================
    // buildClientMeta
    // ========================================
    describe('buildClientMeta', () => {
        it('deve extrair metadados do cliente', () => {
            const client = {
                name: 'João Silva',
                gender: 'male',
                birthDate: '2000-01-01',
                email: 'joao@email.com' // não deve aparecer
            }
            const meta = TestResultRules.buildClientMeta(client)

            expect(meta.clientName).toBe('João Silva')
            expect(meta.clientGender).toBe('male')
            expect(meta.clientBirthDate).toBe('2000-01-01')
            expect(meta.email).toBeUndefined() // não deve vazar
        })

        it('deve usar default para gender quando ausente', () => {
            const client = { name: 'Maria' }
            const meta = TestResultRules.buildClientMeta(client)
            expect(meta.clientGender).toBe('unspecified')
        })

        it('deve tratar birthDate null', () => {
            const client = { name: 'Pedro', gender: 'male' }
            const meta = TestResultRules.buildClientMeta(client)
            expect(meta.clientBirthDate).toBeNull()
        })
    })

    // ========================================
    // generateRanking
    // ========================================
    describe('generateRanking', () => {
        const baseResults = [
            { id: 'r-1', clientName: 'Ana', clientGender: 'female', clientBirthDate: '2000-01-01', resultTime: '1:30', resultDistance: 50 },
            { id: 'r-2', clientName: 'Carlos', clientGender: 'male', clientBirthDate: '1998-05-15', resultTime: '1:15', resultDistance: 75 },
            { id: 'r-3', clientName: 'Beatriz', clientGender: 'female', clientBirthDate: '2002-03-20', resultTime: '2:00', resultDistance: 30 },
        ]

        it('deve ordenar por tempo (ASC) — menor tempo é melhor', () => {
            const ranking = TestResultRules.generateRanking(baseResults, 'time')

            expect(ranking[0].clientName).toBe('Carlos')   // 1:15 = 75s
            expect(ranking[1].clientName).toBe('Ana')       // 1:30 = 90s
            expect(ranking[2].clientName).toBe('Beatriz')   // 2:00 = 120s
        })

        it('deve ordenar por distância (DESC) — maior distância é melhor', () => {
            const ranking = TestResultRules.generateRanking(baseResults, 'distance')

            expect(ranking[0].clientName).toBe('Carlos')    // 75m
            expect(ranking[1].clientName).toBe('Ana')       // 50m
            expect(ranking[2].clientName).toBe('Beatriz')   // 30m
        })

        it('deve usar distância para tipo "fixed-time"', () => {
            const ranking = TestResultRules.generateRanking(baseResults, 'fixed-time')

            expect(ranking[0].testType).toBe('distancia')
            expect(ranking[0].clientName).toBe('Carlos')
        })

        it('deve retornar array vazio para lista vazia', () => {
            const ranking = TestResultRules.generateRanking([], 'time')
            expect(ranking).toEqual([])
        })

        it('deve incluir campos corretos no ranking', () => {
            const ranking = TestResultRules.generateRanking(baseResults, 'time')
            const first = ranking[0]

            expect(first).toHaveProperty('id')
            expect(first).toHaveProperty('clientName')
            expect(first).toHaveProperty('gender')
            expect(first).toHaveProperty('age')
            expect(first).toHaveProperty('result')
            expect(first).toHaveProperty('sortValue')
        })

        it('deve parsear tempo com horas:minutos:segundos', () => {
            const results = [
                { id: 'r-1', clientName: 'A', clientGender: 'male', resultTime: '1:30:00' },
                { id: 'r-2', clientName: 'B', clientGender: 'male', resultTime: '0:45:30' },
            ]
            const ranking = TestResultRules.generateRanking(results, 'time')
            expect(ranking[0].clientName).toBe('B') // 45*60+30 = 2730s vs 1*3600+30*60 = 5400s
        })
    })
})
