/**
 * SessionCounterFixer - Ferramenta de Manutenção para corrigir contadores de presença
 * 
 * USO: Execute no console do navegador:
 * window.SessionCounterFixer.fixAllSessionCounters(idTenant, idBranch)
 * 
 * ATENÇÃO: Esta é uma ferramenta de manutenção para correção manual.
 * Só use quando houver inconsistências nos contadores.
 */

import { enrollmentRepository } from '../../data/repositories/EnrollmentRepository'
import { sessionRepository } from '../../data/repositories/SessionRepository'

export const SessionCounterFixer = {
    /**
     * Recalcula todos os contadores de presença baseado nos snapshots das sessões
     */
    fixAllSessionCounters: async (idTenant, idBranch) => {
        console.log('[SessionCounterFixer] Iniciando correção de contadores...')

        try {
            // 1. Buscar todas as sessões com presença registrada
            const sessions = await sessionRepository.findAll(idTenant, idBranch)
            const sessionsWithAttendance = sessions.filter(s => s.attendanceRecorded && s.attendanceSnapshot?.length > 0)

            console.log(`[SessionCounterFixer] ${sessionsWithAttendance.length} sessões com chamada encontradas`)

            // 2. Mapear contadores por enrollmentId
            const counters = new Map() // enrollmentId -> { attended: 0, missed: 0 }

            for (const session of sessionsWithAttendance) {
                for (const client of session.attendanceSnapshot) {
                    if (!client.enrollmentId) continue

                    if (!counters.has(client.enrollmentId)) {
                        counters.set(client.enrollmentId, { attended: 0, missed: 0 })
                    }

                    const counter = counters.get(client.enrollmentId)
                    if (client.status === 'absent') {
                        counter.missed += 1
                    } else {
                        counter.attended += 1
                    }
                }
            }

            console.log(`[SessionCounterFixer] ${counters.size} matrículas para atualizar`)

            // 3. Atualizar matrículas
            let updated = 0
            for (const [enrollmentId, { attended, missed }] of counters.entries()) {
                try {
                    await enrollmentRepository.update(idTenant, idBranch, enrollmentId, {
                        attendedSessions: attended,
                        missedSessions: missed
                    })
                    updated++
                    console.log(`[SessionCounterFixer] ${enrollmentId}: attended=${attended}, missed=${missed}`)
                } catch (err) {
                    console.warn(`[SessionCounterFixer] Erro ao atualizar ${enrollmentId}:`, err.message)
                }
            }

            console.log(`[SessionCounterFixer] ✅ Correção concluída! ${updated} matrículas atualizadas.`)
            return { success: true, updated }

        } catch (error) {
            console.error('[SessionCounterFixer] Erro:', error)
            return { success: false, error: error.message }
        }
    }
}
