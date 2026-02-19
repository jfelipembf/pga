import { getFirebaseBackend } from '../../helpers/firebase_helper';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { normalizeDate, getStartOfWeek } from '../../utils/date';

/**
 * Repositório e Serviço para Planos de Aula Semanais
 * Estrutura: /tenants/{id}/branches/{id}/training_plans/{planId}
 */
export const PlanningService = {

    getDb: () => {
        const backend = getFirebaseBackend();
        if (!backend) {
            throw new Error("Firebase não inicializado.");
        }
        return backend.db;
    },

    getCollectionRef: (idTenant, idBranch) => {
        const db = PlanningService.getDb();
        return collection(db, 'tenants', idTenant, 'branches', idBranch, 'training_plans');
    },

    /**
     * Salva ou atualiza os objetivos da semana
     * @param {string} idTenant 
     * @param {string} idBranch 
     * @param {Date} date - Data de referência da semana
     * @param {object} objectives - { techA: string, techB: string }
     */
    saveWeeklyObjectives: async (idTenant, idBranch, date, objectives) => {
        try {
            const startOfWeek = getStartOfWeek(date);
            // Formato YYYY-MM-DD
            const planId = `week-${startOfWeek.toISOString().slice(0, 10)}`;

            const colRef = PlanningService.getCollectionRef(idTenant, idBranch);
            const docRef = doc(colRef, planId);

            const payload = {
                weekStart: normalizeDate(startOfWeek),
                objectives: {
                    techniqueA: objectives.techniqueA || '',
                    techniqueB: objectives.techniqueB || ''
                },
                updatedAt: serverTimestamp()
            };

            await setDoc(docRef, payload, { merge: true });

            return { id: planId, ...payload };
        } catch (error) {
            console.error("Erro ao salvar objetivos da semana:", error);
            throw error;
        }
    },

    /**
     * Busca os objetivos da semana atual
     */
    getWeeklyObjectives: async (idTenant, idBranch, date) => {
        try {
            const startOfWeek = getStartOfWeek(date);
            const planId = `week-${startOfWeek.toISOString().slice(0, 10)}`;

            const colRef = PlanningService.getCollectionRef(idTenant, idBranch);
            const docRef = doc(colRef, planId);

            const snap = await getDoc(docRef);

            if (snap.exists()) {
                return snap.data();
            }
            return { objectives: { techniqueA: '', techniqueB: '' } }; // Default vazio
        } catch (error) {
            console.error("Erro ao buscar objetivos:", error);
            return { objectives: { techniqueA: '', techniqueB: '' } };
        }
    }
};
