import { clientRepository } from '../../data/repositories/ClientRepository'
import { clientContractRepository } from '../../data/repositories/ClientContractRepository'
import { classRepository } from '../../data/repositories/ClassRepository'
import { activityRepository } from '../../data/repositories/ActivityRepository'
import { staffRepository } from '../../data/repositories/StaffRepository'
import { sessionRepository } from '../../data/repositories/SessionRepository'

/**
 * Helper para carregar contextos de dados de forma agregada e eficiente.
 * Evita repetição de lógica de busca em múltiplos serviços.
 */
export const ServiceContextHelper = {
    /**
     * Busca dados básicos de uma turma (Turma, Atividade, Instrutor).
     */
    getClassContext: async (idTenant, idBranch, idClass) => {
        try {
            const classData = await classRepository.findById(idTenant, idBranch, idClass);
            if (!classData) return { class: null, activity: null, instructor: null };

            const [activity, instructor] = await Promise.all([
                classData.idActivity ? activityRepository.findById(idTenant, idBranch, classData.idActivity) : null,
                classData.idStaff ? staffRepository.findById(idTenant, idBranch, classData.idStaff) : null
            ]);

            return {
                class: classData,
                activity,
                instructor
            };
        } catch (error) {
            console.error("[ServiceContextHelper] Erro ao buscar contexto da turma:", error);
            return null;
        }
    },

    /**
     * Busca dados de uma sessão específica e seu contexto de turma.
     */
    getSessionContext: async (idTenant, idBranch, sessionId) => {
        try {
            const session = await sessionRepository.findById(idTenant, idBranch, sessionId);
            if (!session) return null;

            const [client, classData, activity, instructor] = await Promise.all([
                session.idClient ? clientRepository.findById(idTenant, idBranch, session.idClient) : null,
                session.idClass ? classRepository.findById(idTenant, idBranch, session.idClass) : null,
                session.idActivity ? activityRepository.findById(idTenant, idBranch, session.idActivity) : null,
                session.idStaff ? staffRepository.findById(idTenant, idBranch, session.idStaff) : null
            ]);

            return {
                session,
                client,
                class: classData,
                activity,
                instructor
            };
        } catch (error) {
            console.error("[ServiceContextHelper] Erro ao buscar contexto da sessão:", error);
            return null;
        }
    },

    /**
     * Busca dados de um Aluno para operações de serviço.
     */
    getClientContext: async (idTenant, idBranch, idClient) => {
        return await clientRepository.findById(idTenant, idBranch, idClient);
    },

    /**
     * Busca um contrato específico.
     */
    getContractContext: async (idTenant, idBranch, idContract) => {
        return await clientContractRepository.findById(idTenant, idBranch, idContract);
    }
};
