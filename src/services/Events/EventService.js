import { eventRepository } from '../../data/repositories/EventRepository'
import { EventSchema } from '../../data/schemas/Events/EventSchema'
import { AuditService } from '../Core/AuditService'
import moment from 'moment'
import { normalizeDate } from '../../utils/date'

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
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date())
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
        // 1. Snapshot Anterior
        const oldData = await eventRepository.findById(idTenant, idBranch, idEvent)

        const payload = {
            ...data,
            updatedBy: user.uid,
            updatedAt: normalizeDate(new Date())
        }

        // 2. Persistir
        await eventRepository.update(idTenant, idBranch, idEvent, payload)

        // 3. Auditoria com Diff
        await AuditService.logUpdate({
            idTenant,
            idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            entityType: 'event',
            entityId: idEvent,
            oldData,
            newData: data,
            description: `Ciclo ${oldData?.name || idEvent} atualizado`
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
        // 1. Snapshot
        const oldData = await eventRepository.findById(idTenant, idBranch, idEvent)

        const payload = {
            status: 'finished',
            updatedBy: user.uid,
            updatedAt: normalizeDate(new Date())
        }

        const result = await eventRepository.update(idTenant, idBranch, idEvent, payload)

        await AuditService.logUpdate({
            idTenant,
            idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            entityType: 'event',
            entityId: idEvent,
            oldData,
            newData: payload,
            description: `Ciclo finalizado manualmente`
        })

        return result
    }
}
