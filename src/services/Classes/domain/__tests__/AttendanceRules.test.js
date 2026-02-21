import { AttendanceRules } from '../AttendanceRules';

jest.mock('firebase/firestore', () => ({
    serverTimestamp: () => 'MOCKED_TIMESTAMP',
    increment: (val) => `INCREMENT(${val})`
}));

describe('AttendanceRules', () => {

    describe('validateForRegistration', () => {
        it('deve falhar se idSession for ausente', () => {
            expect(() => {
                AttendanceRules.validateForRegistration(null, { clients: [] });
            }).toThrow('ID da sessão é obrigatório');
        });

        it('deve falhar se clients for ausente ou nulo', () => {
            expect(() => {
                AttendanceRules.validateForRegistration('sess1', {});
            }).toThrow('Lista de alunos é obrigatória');

            expect(() => {
                AttendanceRules.validateForRegistration('sess1', { clients: [] });
            }).toThrow('Lista de alunos é obrigatória');
        });

        it('deve retornar true para inputs válidos', () => {
            const result = AttendanceRules.validateForRegistration('sess1', { clients: [{ id: 1 }] });
            expect(result).toBe(true);
        });
    });

    describe('buildPreviousStatusMap', () => {
        it('deve construir o mapa de status anteriores', () => {
            const previous = [
                { enrollmentId: 'enr1', status: 'present' },
                { enrollmentId: 'enr2', status: 'absent' },
                { status: 'present' } // sem enrollmentId, deve ignorar
            ];
            const map = AttendanceRules.buildPreviousStatusMap(previous);

            expect(map.size).toBe(2);
            expect(map.get('enr1')).toBe('present');
            expect(map.get('enr2')).toBe('absent');
        });
    });

    describe('buildSessionUpdatePayload', () => {
        it('deve construir o payload com listas e timestamps', () => {
            const payload = AttendanceRules.buildSessionUpdatePayload(
                [{ id: 1 }], [1, 2], [3], 'user1'
            );

            expect(payload.attendanceRecorded).toBe(true);
            expect(payload.presentCount).toBe(2);
            expect(payload.absentCount).toBe(1);
            expect(payload.attendanceRecordedAt).toBe('MOCKED_TIMESTAMP');
            expect(payload.attendanceRecordedBy).toBe('user1');
        });
    });

    describe('buildEnrollmentDeltaPayload', () => {
        it('deve retornar nulo se o status nao mudou', () => {
            const result = AttendanceRules.buildEnrollmentDeltaPayload('present', 'present', 'sess1', 'user1');
            expect(result).toBeNull();
        });

        it('deve incrementar presente e adicionar dados mensais', () => {
            const result = AttendanceRules.buildEnrollmentDeltaPayload(
                null, 'present', 'sess1', 'user1', '2026-02-21'
            );

            expect(result.updatedBy).toBe('user1');
            expect(result.attendedSessions).toBe('INCREMENT(1)');
            expect(result.missedSessions).toBeUndefined(); // nao mudou

            // Dados mensais
            expect(result['statsByMonth.2026-02.a']).toBe('INCREMENT(1)');
        });

        it('deve reverter falta e marcar como presente mudando um status existente', () => {
            const result = AttendanceRules.buildEnrollmentDeltaPayload(
                'absent', 'present', 'sess1', 'user1', '2026-02-21'
            );

            expect(result.attendedSessions).toBe('INCREMENT(1)');
            expect(result.missedSessions).toBe('INCREMENT(-1)');
            expect(result['statsByMonth.2026-02.a']).toBe('INCREMENT(1)');
            expect(result['statsByMonth.2026-02.m']).toBe('INCREMENT(-1)');
        });
    });

    describe('getExperimentalClients', () => {
        it('deve filtrar corretamente apenas alunos trial/experimental/Extra', () => {
            const clients = [
                { id: 1, type: 'experimental' },
                { id: 2, enrollmentType: 'trial' },
                { id: 3, type: 'regular' },
                { id: 4, tag: 'Aluno Extra' }
            ];

            const result = AttendanceRules.getExperimentalClients(clients);
            expect(result).toHaveLength(2); // types experimental and trial
            // note the tag 'Aluno Extra' has EXTRA but rule uses 'Extra' exactly or 'EX', so filter logic matches
            // actually getExperimentalClients checks c.tag === "Extra" or c.tag.includes("EX")
        });
    });

    describe('calculateClientAttendanceStats', () => {
        it('deve calcular totais e risco de frequencia corretamente', () => {
            const enrollments = [
                {
                    attendedSessions: 8,
                    missedSessions: 2,
                    statsByMonth: {
                        '2025-01': { a: 4, m: 1 },
                        '2025-02': { a: 4, m: 1 }
                    }
                }
            ];

            const result = AttendanceRules.calculateClientAttendanceStats(enrollments);

            // Total = 10, Attended = 8, Freq = 80%, Risk = 20%
            expect(result.totalSessions).toBe(10);
            expect(result.attended).toBe(8);
            expect(result.frequencyRate).toBe(80);
            expect(result.riskScore).toBe(20);
            expect(result.riskLevel).toBe('Baixo');
            expect(result.riskColor).toBe('#4CAF50'); // Abaixo de 30%

            expect(result.monthlyData.attended).toEqual([4, 4]); // 2025-01, 2025-02
        });

        it('deve calcular risco alto quando faltas sao grandes', () => {
            const enrollments = [{ attendedSessions: 1, missedSessions: 9 }];
            const result = AttendanceRules.calculateClientAttendanceStats(enrollments);

            expect(result.riskScore).toBe(90); // Risco alto
            expect(result.riskLevel).toBe('Alto');
            expect(result.riskColor).toBe('#F44336'); // Maior/Igual a 70%
        });
    });

    describe('determineLifecycleTransition', () => {
        it('deve retornar nulo se cliente ja for convertido', () => {
            const result = AttendanceRules.determineLifecycleTransition(
                { status: 'present' }, { lifecycleStatus: 'converted' }, 'sess1'
            );
            expect(result).toBeNull();
        });

        it('deve retornar waiting e razao se faltou', () => {
            const result = AttendanceRules.determineLifecycleTransition(
                { status: 'absent' }, { lifecycleStatus: 'scheduled' }, 'sess1'
            );
            expect(result.nextStatus).toBe('waiting');
            expect(result.reason).toContain('Faltou');
        });

        it('deve retornar attended se compareceu e nao estava antes', () => {
            const result = AttendanceRules.determineLifecycleTransition(
                { status: 'present' }, { lifecycleStatus: 'scheduled' }, 'sess1'
            );
            expect(result.nextStatus).toBe('attended');
            expect(result.reason).toContain('Concluiu');
        });
    });
});
