import { areaRepository } from '../../data/repositories/AreaRepository';
import { AuditService } from '../Core/AuditService';

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

            let oldData = null;

            if (isUpdate) {
                oldData = await areaRepository.findById(idTenant, idBranch, data.id);
                const { id, ...updateData } = data;
                await areaRepository.update(idTenant, idBranch, id, updateData);
                result = { id, ...updateData };
            } else {
                const id = await areaRepository.create(idTenant, idBranch, data);
                result = { id, ...data };
            }

            // Log de Auditoria
            if (isUpdate) {
                await AuditService.logUpdate({
                    idTenant,
                    idBranch,
                    userId,
                    userName: data.userName,
                    entityType: 'area',
                    entityId: data.id,
                    oldData,
                    newData: data,
                    description: `Área atualizada: ${result.name}`
                });
            } else {
                await AuditService.log({
                    idTenant,
                    idBranch,
                    userId,
                    userName: data.userName,
                    action: 'AREA_CREATED',
                    entityType: 'area',
                    entityId: result.id,
                    description: `Nova área criada: ${result.name}`
                });
            }

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
                description: `Área excluída: ${area.name}`,
                details: { snapshot: area } // O objeto area passado já é completo? Sim, geralmente. Mas garantindo is good. O caller passa 'area' que parece ser o objeto.
            });

            return true;
        } catch (error) {
            console.error("Erro ao excluir área:", error);
            throw error;
        }
    }
};
