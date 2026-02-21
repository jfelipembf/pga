import { eventRepository } from '../../data/repositories/EventRepository'
import { EventSchema } from '../../data/schemas/Events/EventSchema'
import { EventAuditLogger } from './audit/EventAuditLogger'
import { normalizeDate } from '../../utils/date'
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
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date())
        }

        const result = await eventRepository.create(idTenant, idBranch, payload)

        await EventAuditLogger.logCreation({
            idTenant, idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            entityId: result.id,
            eventName: data.name,
            eventType: data.type,
            startDate: data.startDate,
            endDate: data.endDate
        })

        return result
    },

    /**
     * Atualiza os dados de um evento (Ciclo)
     */
    updateEvent: async (idTenant, idBranch, user, idEvent, data) => {
        const oldData = await eventRepository.findById(idTenant, idBranch, idEvent)

        const payload = {
            ...data,
            updatedBy: user.uid,
            updatedAt: normalizeDate(new Date())
        }

        await eventRepository.update(idTenant, idBranch, idEvent, payload)

        await EventAuditLogger.logUpdate({
            idTenant, idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            entityId: idEvent,
            oldData,
            newData: data
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
        const oldData = await eventRepository.findById(idTenant, idBranch, idEvent)

        const payload = {
            status: 'finished',
            updatedBy: user.uid,
            updatedAt: normalizeDate(new Date())
        }

        const result = await eventRepository.update(idTenant, idBranch, idEvent, payload)

        await EventAuditLogger.logFinish({
            idTenant, idBranch,
            userId: user.uid,
            userName: user.displayName || user.email,
            entityId: idEvent,
            oldData,
            newData: payload
        })

        return result
    }
}
