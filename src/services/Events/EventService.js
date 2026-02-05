import { eventRepository } from '../../data/repositories/EventRepository'
import { EventSchema } from '../../data/schemas/Events/EventSchema'
import { AuditService } from '../Core/AuditService'
import moment from 'moment'

/**
 * Serviço para Gestão de Eventos (Ciclos de Avaliação e Testes)
 */
export const EventService = {
    /**
     * Cria um novo evento (Ciclo)
     */
    createEvent: async (idTenant, idBranch, user, data) => {
        await EventSchema.validate(data, { abortEarly: false })

        const payload = {
            ...data,
            createdBy: user.uid,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const result = await eventRepository.create(idTenant, idBranch, payload)

        await AuditService.log({
            idTenant, idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            action: 'EVENT_CREATED',
            entityType: 'event',
            entityId: result.id,
            description: `Novo ciclo de ${data.type} criado: ${data.name}`,
            details: {
                name: data.name,
                type: data.type,
                startDate: data.startDate,
                endDate: data.endDate
            }
        })

        return result
    },

    /**
     * Atualiza os dados de um evento (Ciclo)
     */
    updateEvent: async (idTenant, idBranch, user, idEvent, data) => {
        const payload = {
            ...data,
            updatedBy: user.uid,
            updatedAt: new Date()
        }

        await eventRepository.update(idTenant, idBranch, idEvent, payload)

        await AuditService.log({
            idTenant, idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            action: 'EVENT_UPDATED',
            entityType: 'event',
            entityId: idEvent,
            description: `Ciclo ${data.name || idEvent} atualizado`,
            details: {
                changes: Object.keys(data).filter(k => k !== 'updatedAt')
            }
        })

        return true
    },

    /**
     * Busca o evento ativo para hoje de um determinado tipo
     */
    getActiveEvent: async (idTenant, idBranch, type) => {
        const today = moment().format('YYYY-MM-DD')
        return await eventRepository.findActiveByType(idTenant, idBranch, type, today)
    },

    /**
     * Lista todos os eventos de um tipo
     */
    listEvents: async (idTenant, idBranch, type = 'evaluation') => {
        return await eventRepository.listByType(idTenant, idBranch, type)
    },

    /**
     * Finaliza um evento manualmente
     */
    finishEvent: async (idTenant, idBranch, user, idEvent) => {
        const result = await eventRepository.update(idTenant, idBranch, idEvent, {
            status: 'finished',
            updatedBy: user.uid
        })

        await AuditService.log({
            idTenant, idBranch,
            userId: user.uid,
            action: 'EVENT_FINISHED',
            entityType: 'event',
            entityId: idEvent,
            description: `Ciclo de evento finalizado manualmente: ${idEvent}`
        })

        return result
    }
}
