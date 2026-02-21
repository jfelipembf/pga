import { ClientContractVigencyRules } from '../ClientContractVigencyRules';

// Mocar normalizeDate para evitar dependência de fatores externos (se necessário)
jest.mock('../../../../../utils/date', () => ({
    normalizeDate: (d) => {
        if (!d) return null;
        if (d instanceof Date) return new Date(d);
        if (typeof d.toDate === 'function') return d.toDate();
        return new Date(d); // Conversão super simples para mock
    }
}));


describe('ClientContractVigencyRules', () => {

    // ==========================================
    // calculatePeriod
    // ==========================================
    describe('calculatePeriod', () => {
        it('deve adicionar dias corretamente e retornar tipo single', () => {
            const baseDate = new Date('2025-01-01T12:00:00');
            const result = ClientContractVigencyRules.calculatePeriod(baseDate, 10, 'days');

            expect(result.planType).toBe('single');
            // 2025-01-01 + 10 dias = 2025-01-11
            expect(result.endDate.getDate()).toBe(11);
        });

        it('deve adicionar semanas corretamente', () => {
            const baseDate = new Date('2025-01-01T12:00:00');
            const result = ClientContractVigencyRules.calculatePeriod(baseDate, 2, 'weeks');

            // 2 semanas = 14 dias -> 1 + 14 = 15
            expect(result.endDate.getDate()).toBe(15);
        });

        it('deve adicionar anos e retornar tipo annual', () => {
            const baseDate = new Date('2025-01-01T12:00:00');
            const result = ClientContractVigencyRules.calculatePeriod(baseDate, 1, 'years');

            expect(result.planType).toBe('annual');
            expect(result.endDate.getFullYear()).toBe(2026);
        });

        it('deve adicionar meses e retornar tipo monthly por padrão se duração 1', () => {
            const baseDate = new Date('2025-01-01T12:00:00');
            const result = ClientContractVigencyRules.calculatePeriod(baseDate, 1, 'months');

            expect(result.planType).toBe('monthly');
            expect(result.endDate.getMonth()).toBe(1); // Fevereiro (0-indexed)
        });

        it('deve retornar semiannual se duração for 6 meses', () => {
            const baseDate = new Date('2025-01-01T12:00:00');
            const result = ClientContractVigencyRules.calculatePeriod(baseDate, 6, 'months');

            expect(result.planType).toBe('semiannual');
        });
    });

    // ==========================================
    // resolveStatus
    // ==========================================
    describe('resolveStatus', () => {

        beforeAll(() => {
            // Fixar data atual para "Hoje é 2025-01-15"
            jest.useFakeTimers().setSystemTime(new Date('2025-01-15T12:00:00'));
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it('deve retornar unknown para contrato nulo ou sem data de fim', () => {
            expect(ClientContractVigencyRules.resolveStatus(null)).toBe('unknown');
            expect(ClientContractVigencyRules.resolveStatus({ status: 'active', endDate: null })).toBe('unknown');
        });

        it('deve priorizar status cancelado', () => {
            const contract = { status: 'cancelled', endDate: new Date('2026-01-01') };
            expect(ClientContractVigencyRules.resolveStatus(contract)).toBe('cancelled');
        });

        it('deve priorizar status suspenso', () => {
            const contract = { status: 'suspended', endDate: new Date('2026-01-01') };
            expect(ClientContractVigencyRules.resolveStatus(contract)).toBe('suspended');
        });

        it('deve retornar ativo se data de fim for maior que hoje', () => {
            // Hoje é 2025-01-15, fim em 2025-02-01
            const contract = { status: 'active', endDate: new Date('2025-02-01T12:00:00') };
            expect(ClientContractVigencyRules.resolveStatus(contract)).toBe('active');
        });

        it('deve retornar ativo se data de fim for igual a hoje', () => {
            // Hoje é 2025-01-15
            const contract = { status: 'active', endDate: new Date('2025-01-15T12:00:00') };
            expect(ClientContractVigencyRules.resolveStatus(contract)).toBe('active');
        });

        it('deve retornar expired se data de fim for menor que hoje', () => {
            // Hoje é 2025-01-15, terminou em 2025-01-01
            const contract = { status: 'active', endDate: new Date('2025-01-01T12:00:00') };
            expect(ClientContractVigencyRules.resolveStatus(contract)).toBe('expired');
        });
    });
});
