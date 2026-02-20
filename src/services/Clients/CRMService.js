import { clientRepository } from '../../data/repositories/ClientRepository'
import { clientContractRepository } from '../../data/repositories/ClientContractRepository'
import { salesRepository } from '../../data/repositories/SalesRepository'
import moment from 'moment'
import { formatDate } from '../../utils/date'

/**
 * Serviço de CRM para busca avançada e filtragem cruzada de alunos.
 * Centraliza a lógica de "filtros somados" requerida pela UI.
 */
export const CRMService = {
    /**
     * Busca clientes aplicando filtros complexos de múltiplas entidades.
     */
    listFilteredClients: async (idTenant, idBranch, filters = {}) => {
        try {
            console.log("[CRMService] Iniciando busca filtrada com:", filters)

            // 1. Fetch de Dados Base (Otimizado com 'computed' fields)
            // Agora evitamos buscar TODOS os contratos e matrículas se os filtros puderem ser resolvidos pelo 'computed'
            const needsSales = !!(filters.salesRep || filters.saleDateStart || filters.saleDateEnd)
            const needsFullContracts = !!(filters.status === 'suspended' || filters.status === 'canceled')

            const fetchPromises = [clientRepository.findActive(idTenant, idBranch)]
            if (needsFullContracts) fetchPromises.push(clientContractRepository.findAll(idTenant, idBranch))
            if (needsSales) fetchPromises.push(salesRepository.findAll(idTenant, idBranch))

            const [allClients, allContracts = [], allSales = []] = await Promise.all(fetchPromises)

            // 2. Indexação auxiliar (Otimizada: Contratos apenas se necessário)
            const contractsByClient = {}
            allContracts.forEach(c => {
                if (!contractsByClient[c.idClient]) contractsByClient[c.idClient] = []
                contractsByClient[c.idClient].push(c)
            })

            const salesByClient = {}
            allSales.forEach(s => {
                if (s.deletedAt) return
                if (!salesByClient[s.idClient]) salesByClient[s.idClient] = []
                salesByClient[s.idClient].push(s)
            })

            // 3. Mecanismo de Filtragem (Pipeline)
            let filteredResults = allClients.filter(client => {
                const computed = client.computed || {}

                // --- Filtro por Busca Rápida (Nome, Email, CPF, Telefone) ---
                if (filters.searchTerm) {
                    const term = filters.searchTerm.toLowerCase().trim()

                    if (computed.searchText) {
                        if (!computed.searchText.includes(term)) return false
                    } else {
                        // Fallback para dados não sincronizados
                        const matches = (
                            client.name?.toLowerCase().includes(term) ||
                            client.email?.toLowerCase().includes(term) ||
                            client.phone?.includes(term) ||
                            client.cpf?.includes(term) ||
                            String(client.friendlyId).includes(term)
                        )
                        if (!matches) return false
                    }
                }

                // --- Filtro por Sexo ---
                if (filters.gender && filters.gender !== 'all') {
                    if (client.gender !== filters.gender) return false
                }

                // --- Filtro por Status (Regra: Contrato tem Precedência Total) ---
                if (filters.status && filters.status !== 'all') {
                    // 1. Identifica se o cliente já teve qualquer contrato na vida (via computed ou histórico)
                    const hasContractHistory = !!(computed.activeContractId || computed.contractEndDate || (contractsByClient[client.id]?.length > 0))

                    // 2. Determina o Status Efetivo do Cliente
                    let effectiveStatus = ''
                    if (!hasContractHistory) {
                        // Se nunca teve contrato, ele é OBRIGATORIAMENTE um Lead
                        effectiveStatus = 'lead'
                    } else {
                        // Se já teve contrato, o status vem do contrato (computed.activeContractId define se está Ativo agora)
                        if (computed.activeContractId) {
                            effectiveStatus = 'active'
                        } else {
                            // Se não está ativo mas tem histórico, buscamos o status do último contrato conhecido
                            const clientContracts = contractsByClient[client.id] || []
                            if (clientContracts.length > 0) {
                                // Ordena por data de atualização ou criação para pegar o mais recente
                                const latest = clientContracts.sort((a, b) => {
                                    const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0)
                                    const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0)
                                    return dateB - dateA
                                })[0]
                                effectiveStatus = latest.status // active, suspended, canceled, etc.
                            } else {
                                // Fallback: Se o computed diz que teve contrato mas não carregamos a lista, 
                                // assumimos que não é lead.
                                effectiveStatus = 'no_active_contract'
                            }
                        }
                    }

                    // 3. Aplicação do Filtro
                    if (filters.status === 'active') {
                        if (effectiveStatus !== 'active') return false
                    }
                    else if (filters.status === 'lead') {
                        if (effectiveStatus !== 'lead') return false
                    }
                    else if (filters.status === 'suspended') {
                        if (effectiveStatus !== 'suspended') return false
                    }
                    else if (filters.status === 'canceled') {
                        // No CRM, 'canceled' ou 'lost' são tratados como o fim da linha do contrato
                        if (!['canceled', 'cancelled', 'expired'].includes(effectiveStatus)) return false
                    }
                    else if (filters.status === 'inactive') {
                        // Inativo é um estado explícito do lifecycle ou ausência de contrato atual
                        if (client.lifecycleStatus !== 'inactive' && effectiveStatus !== 'inactive') return false
                    }
                }

                // --- Filtro por Idade ---
                if (filters.ageMin || filters.ageMax) {
                    const birthDate = client.birthDate?.toDate ? client.birthDate.toDate() : (client.birthDate ? new Date(client.birthDate) : null)
                    if (birthDate) {
                        const age = moment().diff(moment(birthDate), 'years')
                        if (filters.ageMin && age < parseInt(filters.ageMin)) return false
                        if (filters.ageMax && age > parseInt(filters.ageMax)) return false
                    } else {
                        return false
                    }
                }

                // --- Filtros Dependentes de Plano (Usa Computed) ---
                if (filters.planType && filters.planType !== 'all') {
                    if (computed.planType !== filters.planType) return false
                }

                if (filters.idPlan && filters.idPlan !== 'all') {
                    if (computed.idPlan !== filters.idPlan) return false
                }

                if (filters.planName && (!computed.activePlanName?.toLowerCase().includes(filters.planName.toLowerCase()))) {
                    return false
                }

                // Vencimento entre (Range) (Usa Computed)
                if (filters.contractEndStart || filters.contractEndEnd) {
                    if (!computed.contractEndDate) return false
                    const end = computed.contractEndDate.toDate ? computed.contractEndDate.toDate() : new Date(computed.contractEndDate)
                    if (filters.contractEndStart && moment(end).isBefore(moment(filters.contractEndStart), 'day')) return false
                    if (filters.contractEndEnd && moment(end).isAfter(moment(filters.contractEndEnd), 'day')) return false
                }

                // --- Filtros Dependentes de Matrícula (Atividade/Professor) (Usa Computed) ---
                if (filters.activity && filters.activity !== 'all') {
                    const activities = computed.activeActivities || []
                    if (!activities.some(a => a.toLowerCase().includes(filters.activity.toLowerCase()))) return false
                }

                if (filters.instructor && filters.instructor !== 'all') {
                    const instructors = computed.activeInstructors || []
                    if (!instructors.some(i => i.toLowerCase().includes(filters.instructor.toLowerCase()))) return false
                }

                // --- Filtros Dependentes de Venda (Apenas se requisitado) ---
                if (needsSales) {
                    const clientSales = salesByClient[client.id] || []
                    if (filters.salesRep && filters.salesRep !== 'all') {
                        if (!clientSales.some(s => s.sellerName?.toLowerCase().includes(filters.salesRep.toLowerCase()) || s.createdBy === filters.salesRep)) return false
                    }
                    if (filters.saleDateStart || filters.saleDateEnd) {
                        const hasSaleInRange = clientSales.some(s => {
                            const sDate = s.saleDate?.toDate ? s.saleDate.toDate() : new Date(s.saleDate)
                            let ok = true
                            if (filters.saleDateStart && moment(sDate).isBefore(moment(filters.saleDateStart), 'day')) ok = false
                            if (filters.saleDateEnd && moment(sDate).isAfter(moment(filters.saleDateEnd), 'day')) ok = false
                            return ok
                        })
                        if (!hasSaleInRange) return false
                    }
                }

                return true
            })

            // 4. Enriquecimento dos resultados (Usa Computed para fornecer status real do contrato)
            return filteredResults.map(client => {
                const computed = client.computed || {}
                const endDate = computed.contractEndDate?.toDate ? computed.contractEndDate.toDate() : (computed.contractEndDate ? new Date(computed.contractEndDate) : null)

                // Determina status descritivo para o Frontend
                let contractStatus = 'no_contract'
                if (computed.activeContractId) {
                    contractStatus = 'active'
                } else if (computed.contractEndDate) {
                    // Se tem data de fim mas não tem ID ativo, está expirado/inativo
                    contractStatus = 'inactive'
                }

                return {
                    ...client,
                    planName: computed.activePlanName || 'Sem Plano',
                    contractStatus,
                    contractEndDate: endDate ? formatDate(endDate) : '-',
                    daysToExpiration: endDate ? moment(endDate).diff(moment(), 'days') : 0,
                    activities: computed.activeActivities || [],
                    monthlyValue: computed.monthlyValue || 0
                }
            })

        } catch (error) {
            console.error("[CRMService] Erro na busca filtrada:", error)
            throw error
        }
    }
}
