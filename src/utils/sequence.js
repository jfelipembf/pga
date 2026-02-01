import { sequenceRepository } from '../data/repositories/SequenceRepository'

/**
 * Gera um ID amigável com prefixo e preenchimento (ex: CLI-00001).
 * 
 * @param {string} idTenant ID do Tenant
 * @param {string} idBranch ID da Branch
 * @param {string} counterName Nome do contador (ex: 'clients')
 * @param {Object} options Configurações de prefixo e preenchimento
 */
export const generateFriendlyId = async (idTenant, idBranch, counterName, { prefix = "", padding = 5 } = {}) => {
    const seq = await sequenceRepository.getNextSequence(idTenant, idBranch, counterName)
    const strSeq = String(seq).padStart(padding, '0')
    return prefix ? `${prefix}-${strSeq}` : strSeq
}
