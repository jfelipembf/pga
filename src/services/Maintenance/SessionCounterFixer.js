import { getFirebaseBackend } from '../../helpers/firebase_helper'
import { collection, getDocs, getCountFromServer, updateDoc, query, where } from 'firebase/firestore'

/**
 * Serviço de Manutenção para corrigir contadores de sessão
 */
export const SessionCounterFixer = {
    /**
     * Recalcula e corrige o campo enrolledCount de todas as sessões não deletadas
     * baseando-se na quantidade real de documentos na subcoleção enrolledClients.
     * 
     * @param {string} idTenant 
     * @param {string} idBranch 
     */
    fixAllSessionCounters: async (idTenant, idBranch) => {
        const db = getFirebaseBackend().db
        console.log(`[Fixer] Iniciando correção de contadores para Tenant: ${idTenant}, Branch: ${idBranch}`)

        try {
            // 1. Buscar todas as sessões não deletadas
            const sessionsRef = collection(db, 'tenants', idTenant, 'branches', idBranch, 'sessions')
            const q = query(sessionsRef, where('deletedAt', '==', null))

            const snapshot = await getDocs(q)
            console.log(`[Fixer] Total de sessões encontradas: ${snapshot.size}`)

            let updatedCount = 0
            let errorCount = 0

            // 2. Iterar sobre cada sessão (Serializado para não sobrecarregar)
            for (const sessionDoc of snapshot.docs) {
                const sessionData = sessionDoc.data()
                const sessionId = sessionDoc.id

                try {
                    // 3. Contar registros reais na subcoleção enrolledClients
                    const enrolledRef = collection(db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId, 'enrolledClients')
                    const enrolledQuery = query(enrolledRef, where('deleted', '==', false))

                    const countSnapshot = await getCountFromServer(enrolledQuery)
                    const realCount = countSnapshot.data().count

                    // 4. Se houver discrepância, atualizar
                    // Verifica também se o campo existe (undefined com count 0 deve ser atualizado)
                    if (sessionData.enrolledCount !== realCount) {
                        console.log(`[Fixer] Corrigindo Sessão ${sessionId} (${sessionData.sessionDate}): De ${sessionData.enrolledCount} para ${realCount}`)

                        await updateDoc(sessionDoc.ref, {
                            enrolledCount: realCount,
                            // Opcional: Atualizar flag se count for 0 pra garantir consistência
                            // hasEnrollments: realCount > 0 
                        })
                        updatedCount++
                    }
                } catch (err) {
                    console.error(`[Fixer] Erro ao processar sessão ${sessionId}:`, err)
                    errorCount++
                }
            }

            console.log(`[Fixer] Processo finalizado!`)
            console.log(`[Fixer] Sessões corrigidas: ${updatedCount}`)
            console.log(`[Fixer] Erros: ${errorCount}`)

            return { success: true, updatedCount, errorCount }

        } catch (error) {
            console.error('[Fixer] Falha crítica no script:', error)
            return { success: false, error }
        }
    }
}
