import { clientRepository } from '../../data/repositories/ClientRepository'
import { clientContractRepository } from '../../data/repositories/ClientContractRepository'
import { enrollmentRepository } from '../../data/repositories/EnrollmentRepository'
import { salesRepository } from '../../data/repositories/SalesRepository'
import moment from 'moment'

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

            // 1. Fetch de Dados Base (Paralelizado para performance)
            // Em um cenário de escalas massivas, usaríamos ElasticSearch ou algolia.
            // Aqui, devido ao multitenancy e volume de academia, filtramos em memória após buscar o snapshot ativo.
            const [allClients, allContracts, allEnrollments, allSales] = await Promise.all([
                clientRepository.findActive(idTenant, idBranch),
                clientContractRepository.findAll(idTenant, idBranch), // Buscamos todos para cruzar
                enrollmentRepository.findAll(idTenant, idBranch),
                salesRepository.findAll(idTenant, idBranch)
            ])

            // 2. Indexação auxiliar para busca rápida O(1)
            const contractsByClient = {}
            allContracts.forEach(c => {
                if (!contractsByClient[c.idClient]) contractsByClient[c.idClient] = []
                contractsByClient[c.idClient].push(c)
            })

            const enrollmentsByClient = {}
            allEnrollments.forEach(e => {
                if (e.status !== 'active') return
                if (!enrollmentsByClient[e.idClient]) enrollmentsByClient[e.idClient] = []
                enrollmentsByClient[e.idClient].push(e)
            })

            const salesByClient = {}
            allSales.forEach(s => {
                if (s.deletedAt) return
                if (!salesByClient[s.idClient]) salesByClient[s.idClient] = []
                salesByClient[s.idClient].push(s)
            })

            // 3. Mecanismo de Filtragem (Pipeline)
            let filteredResults = allClients.filter(client => {
                // --- Filtro por Busca Rápida (Nome, Email, CPF, Telefone) ---
                if (filters.searchTerm) {
                    const term = filters.searchTerm.toLowerCase()
                    const matches = (
                        client.name?.toLowerCase().includes(term) ||
                        client.email?.toLowerCase().includes(term) ||
                        client.phone?.includes(term) ||
                        client.cpf?.includes(term)
                    )
                    if (!matches) return false
                }

                // --- Filtro por Sexo ---
                if (filters.gender && filters.gender !== 'all') {
                    if (client.gender !== filters.gender) return false
                }

                // --- Filtro por Status Simplificado ---
                if (filters.status && filters.status !== 'all') {
                    const clientContracts = contractsByClient[client.id] || []
                    const activeContract = clientContracts.find(c => c.status === 'active')

                    if (filters.status === 'active') {
                        // Ativo se tiver contrato ativo OU lifecycle ativo
                        const isContractActive = activeContract?.status === 'active'
                        const isLifecycleActive = client.lifecycleStatus === 'active'
                        if (!isContractActive && !isLifecycleActive) return false
                    }
                    else if (filters.status === 'inactive') {
                        // Inativo é puramente lifecycle hoje
                        if (client.lifecycleStatus !== 'inactive') return false
                    }
                    else if (filters.status === 'suspended') {
                        const isContractSuspended = clientContracts.some(c => c.status === 'suspended')
                        const isLifecycleSuspended = client.lifecycleStatus === 'suspended'
                        if (!isContractSuspended && !isLifecycleSuspended) return false
                    }
                    else if (filters.status === 'lead') {
                        if (client.lifecycleStatus !== 'lead') return false
                    }
                    else if (filters.status === 'canceled') {
                        const isContractCanceled = clientContracts.some(c => c.status === 'canceled')
                        const isLifecycleLost = client.lifecycleStatus === 'lost'
                        if (!isContractCanceled && !isLifecycleLost) return false
                    }
                }

                // --- Filtro por Idade ---
                if (filters.ageMin || filters.ageMax) {
                    const birthDate = client.birthDate?.toDate ? client.birthDate.toDate() : new Date(client.birthDate)
                    const age = moment().diff(moment(birthDate), 'years')
                    if (filters.ageMin && age < parseInt(filters.ageMin)) return false
                    if (filters.ageMax && age > parseInt(filters.ageMax)) return false
                }

                // --- Filtros Dependentes de Contrato ---
                const clientContracts = contractsByClient[client.id] || []
                const activeContract = clientContracts.find(c => c.status === 'active')

                if (filters.planType && filters.planType !== 'all') {
                    if (!activeContract || activeContract.planType !== filters.planType) return false
                }

                if (filters.idPlan && filters.idPlan !== 'all') {
                    if (!activeContract || activeContract.idPlan !== filters.idPlan) return false
                }

                if (filters.planName && (!activeContract || !activeContract.planName?.toLowerCase().includes(filters.planName.toLowerCase()))) {
                    return false
                }

                // Vencimento entre (Range)
                if (filters.contractEndStart || filters.contractEndEnd) {
                    if (!activeContract) return false
                    const end = activeContract.endDate?.toDate ? activeContract.endDate.toDate() : new Date(activeContract.endDate)
                    if (filters.contractEndStart && moment(end).isBefore(moment(filters.contractEndStart), 'day')) return false
                    if (filters.contractEndEnd && moment(end).isAfter(moment(filters.contractEndEnd), 'day')) return false
                }

                // --- Filtros Dependentes de Matrícula (Atividade/Professor) ---
                const clientEnrollments = enrollmentsByClient[client.id] || []

                if (filters.activity && filters.activity !== 'all') {
                    if (!clientEnrollments.some(e => e.activityName?.toLowerCase().includes(filters.activity.toLowerCase()))) return false
                }

                if (filters.instructor && filters.instructor !== 'all') {
                    // Se for um ID (ex: inst1), idealmente cruzaríamos pelo ID, mas aqui está vindo texto ou ID fixo do mock
                    if (!clientEnrollments.some(e =>
                        e.instructorName?.toLowerCase().includes(filters.instructor.toLowerCase()) ||
                        e.idStaff === filters.instructor
                    )) return false
                }

                // --- Filtros Dependentes de Venda (Consultor / Data de Compra) ---
                const clientSales = salesByClient[client.id] || []

                if (filters.salesRep && filters.salesRep !== 'all') {
                    if (!clientSales.some(s =>
                        s.sellerName?.toLowerCase().includes(filters.salesRep.toLowerCase()) ||
                        s.createdBy === filters.salesRep
                    )) return false
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

                return true
            })

            // 4. Enriquecimento dos resultados para a UI
            // Adicionamos dados calculados que a UI precisa exibir
            return filteredResults.map(client => {
                const clientContracts = contractsByClient[client.id] || []
                const activeContract = clientContracts.find(c => c.status === 'active')
                const clientEnrollments = enrollmentsByClient[client.id] || []

                const lastContractDate = activeContract ? (activeContract.endDate?.toDate ? activeContract.endDate.toDate() : new Date(activeContract.endDate)) : null

                return {
                    ...client,
                    planName: activeContract?.planName || 'Sem Plano',
                    contractStatus: activeContract?.status || 'no_contract',
                    contractEndDate: lastContractDate ? moment(lastContractDate).format('DD/MM/YYYY') : '-',
                    daysToExpiration: lastContractDate ? moment(lastContractDate).diff(moment(), 'days') : 0,
                    activities: [...new Set(clientEnrollments.map(e => e.activityName).filter(Boolean))],
                    monthlyValue: activeContract?.value || 0
                }
            })

        } catch (error) {
            console.error("[CRMService] Erro na busca filtrada:", error)
            throw error
        }
    }
}
