import { BaseRepository } from './BaseRepository'
import { doc, runTransaction } from 'firebase/firestore'

/**
 * Repositório para gerenciar sequências incrementais (contadores).
 */
class SequenceRepository extends BaseRepository {
    constructor() {
        super('counters')
    }

    /**
     * Incrementa atomicamente um contador e retorna o novo valor.
     */
    async getNextSequence(idTenant, idBranch, counterName, incrementBy = 1) {
        const counterRef = doc(this.getCollectionRef(idTenant, idBranch), counterName)

        return await runTransaction(this.db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef)

            let nextValue = incrementBy

            if (counterDoc.exists()) {
                nextValue = (counterDoc.data().current || 0) + incrementBy
            }

            transaction.set(counterRef, { current: nextValue }, { merge: true })

            return nextValue
        })
    }
}

export const sequenceRepository = new SequenceRepository()
