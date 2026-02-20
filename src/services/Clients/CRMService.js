import { clientRepository } from '../../data/repositories/ClientRepository'
import { clientContractRepository } from '../../data/repositories/ClientContractRepository'
import { salesRepository } from '../../data/repositories/SalesRepository'
import { formatDate, getAge, isBeforeDate, isAfterDate, diffDaysFromNow } from '../../utils/date'

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

                // --- Filtro por Status ---
                if (filters.status && filters.status !== 'all') {
                    // Mapeia o filtro da UI para os status reais do Cliente
                    if (filters.status === 'active') {
                        if (client.status !== 'active') return false
                    }
                    else if (filters.status === 'lead') {
                        if (client.lifecycleStatus !== 'lead') return false
                    }
                    else if (filters.status === 'suspended') {
                        if (client.status !== 'suspended') return false
                    }
                    else if (filters.status === 'canceled') {
                        if (client.lifecycleStatus !== 'lost' && client.status !== 'inactive') return false
                    }
                    else if (filters.status === 'inactive') {
                        if (client.status !== 'inactive') return false
                    }
                }

                // --- Filtro por Idade ---
                if (filters.ageMin || filters.ageMax) {
                    const age = getAge(client.birthDate)
                    if (age !== null) {
                        if (filters.ageMin && age < parseInt(filters.ageMin)) return false
                        if (filters.ageMax && age > parseInt(filters.ageMax)) return false
                    } else {
                        return false // Se tem filtro de idade mas o cliente não tem Data Nasc, exclui
                    }
                }

                // --- Filtros Dependentes de Plano (Usa Computed Array) ---
                const activeContracts = computed.activeContracts || []

                if (filters.planType && filters.planType !== 'all') {
                    if (!activeContracts.some(c => c.planType === filters.planType)) return false
                }

                if (filters.idPlan && filters.idPlan !== 'all') {
                    if (!activeContracts.some(c => c.idContract === filters.idPlan)) return false
                }

                if (filters.planName) {
                    const term = filters.planName.toLowerCase()
                    if (!activeContracts.some(c => c.planName?.toLowerCase().includes(term))) return false
                }

                // Vencimento entre (Range) (Usa Computed Array)
                if (filters.contractEndStart || filters.contractEndEnd) {
                    const hasContractEndingInRange = activeContracts.some(c => {
                        if (!c.endDate) return false
                        let ok = true
                        if (filters.contractEndStart && isBeforeDate(c.endDate, filters.contractEndStart)) ok = false
                        if (filters.contractEndEnd && isAfterDate(c.endDate, filters.contractEndEnd)) ok = false
                        return ok
                    })
                    if (!hasContractEndingInRange) return false
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
                            let ok = true
                            if (filters.saleDateStart && isBeforeDate(s.saleDate, filters.saleDateStart)) ok = false
                            if (filters.saleDateEnd && isAfterDate(s.saleDate, filters.saleDateEnd)) ok = false
                            return ok
                        })
                        if (!hasSaleInRange) return false
                    }
                }

                return true
            })

            // 4. Enriquecimento dos resultados
            return filteredResults.map(client => {
                const computed = client.computed || {}
                const activeContracts = computed.activeContracts || []

                // Pega informações do contrato mais recente se houver
                const mainContract = activeContracts[0] || {}

                return {
                    ...client,
                    planName: mainContract.planName || 'Sem Plano',
                    contractStatus: client.status || 'lead',
                    contractEndDate: mainContract.endDate ? formatDate(mainContract.endDate) : '-',
                    daysToExpiration: diffDaysFromNow(mainContract.endDate),
                    activities: computed.activeActivities || [],
                    monthlyValue: mainContract.value || 0
                }
            })

        } catch (error) {
            console.error("[CRMService] Erro na busca filtrada:", error)
            throw error
        }
    }
}
