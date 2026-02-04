import { areaRepository } from '../../data/repositories/AreaRepository';
import { AuditService } from '../Audit/AuditService';

export const AreaService = {
    /**
     * Lista todas as áreas de uma unidade (excluindo deletadas)
     */
    listAreas: async (idTenant, idBranch) => {
        try {
            const allAreas = await areaRepository.findAll(idTenant, idBranch);
            return allAreas.filter(a => !a.deletedAt);
        } catch (error) {
            console.error("Erro ao listar áreas:", error);
            throw error;
        }
    },

    /**
     * Salva ou atualiza uma área
     */
    saveArea: async (idTenant, idBranch, userId, data) => {
        try {
            const isUpdate = !!data.id;
            let result;

            if (isUpdate) {
                const { id, ...updateData } = data;
                await areaRepository.update(idTenant, idBranch, id, updateData);
                result = { id, ...updateData };
            } else {
                const id = await areaRepository.create(idTenant, idBranch, data);
                result = { id, ...data };
            }

            // Log de Auditoria
            await AuditService.log({
                idTenant,
                idBranch,
                userId,
                userName: data.userName,
                action: isUpdate ? 'AREA_UPDATED' : 'AREA_CREATED',
                entityType: 'area',
                entityId: result.id,
                description: `${isUpdate ? 'Área atualizada' : 'Nova área criada'}: ${result.name}`
            });

            return result;
        } catch (error) {
            console.error("Erro ao salvar área:", error);
            throw error;
        }
    },

    /**
     * Remove uma área (Soft Delete)
     */
    deleteArea: async (idTenant, idBranch, userId, area, userName) => {
        try {
            // Validação
            if (!area || !area.id) throw new Error("Área não encontrada")
            if (area.deletedAt) throw new Error("Área já foi excluída")

            // Usa softDelete do BaseRepository
            await areaRepository.softDelete(idTenant, idBranch, area.id, userId);

            await AuditService.log({
                idTenant,
                idBranch,
                userId,
                userName: userName,
                action: 'AREA_DELETED',
                entityType: 'area',
                entityId: area.id,
                description: `Área excluída: ${area.name}`
            });

            return true;
        } catch (error) {
            console.error("Erro ao excluir área:", error);
            throw error;
        }
    }
};
