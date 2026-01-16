import { getDocs, query, where, orderBy } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { clientsCol, getContext, listClientsByIdsRepo } from "../Clients/clients.repository"
import { clientContractsCollection } from "../ClientContracts/clientContracts.repository"
import { receivablesCol } from "../Receivables/receivables.repository"

/**
 * Service to handle CRM data fetching.
 * Centralizes queries for different segments.
 */

// Helper para formatar data localmente (evita bug de timezone do toISOString)
const toYMD = (date) => {
    if (!date) return ""
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

export const loadCrmSegment = async (segmentId, filterDateStart, filterDateEnd) => {
    const db = requireDb()
    const ctx = getContext()



    switch (segmentId) {
        case "leads":
            return listLeads(db, ctx, filterDateStart, filterDateEnd)
        case "birthday":
            return listBirthdays(db, ctx, filterDateStart, filterDateEnd)
        case "active":
            return listByStatus(db, ctx, "active", filterDateStart, filterDateEnd)
        case "inactive":
            return listByStatus(db, ctx, "inactive", filterDateStart, filterDateEnd)
        case "suspended":
            return listByStatus(db, ctx, "suspended", filterDateStart, filterDateEnd)
        case "canceled":
            return listByStatus(db, ctx, "canceled", filterDateStart, filterDateEnd)
        case "contractsDue":
            return listContractsDue(db, ctx, filterDateStart, filterDateEnd)
        case "credit":
            return listClientsWithCredit(db, ctx)
        case "debt":
            return listClientsWithDebt(db, ctx)

        default:
            return []
    }
}

// =============================================================================
// SEGMENT IMPLEMENTATIONS
// =============================================================================

const mapDocs = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }))

/**
 * 01. Leads / Funil
 */
export const listLeads = async (db, ctx, start, end) => {
    const ref = clientsCol(db, ctx)
    let q
    if (start && end) {
        // Firestore Timestamp comparison
        q = query(
            ref,
            where("status", "==", "lead"),
            where("createdAt", ">=", start),
            where("createdAt", "<=", end),
            orderBy("createdAt", "desc")
        )
    } else {
        q = query(ref, where("status", "==", "lead"), orderBy("createdAt", "desc"))
    }

    const snap = await getDocs(q)
    return snap.docs.map(d => {
        const data = d.data()
        // Tenta pegar o estágio do funil
        const stage = data.funnel?.stage || "Novo"
        return {
            id: d.id,
            ...data,
            referenceLabel: stage
        }
    })
}

/**
 * 02. Aniversariantes
 */
export const listBirthdays = async (db, ctx, start, end) => {
    const ref = clientsCol(db, ctx)
    // Busca ativos e leads (aniversário pode ocorrer em ambos)
    const q = query(ref, where("status", "in", ["active", "lead"]), orderBy("name", "asc"))
    const snap = await getDocs(q)
    const clients = mapDocs(snap)

    const isAfterOrEqual = (m1, d1, m2, d2) => m1 > m2 || (m1 === m2 && d1 >= d2)
    const isBeforeOrEqual = (m1, d1, m2, d2) => m1 < m2 || (m1 === m2 && d1 <= d2)

    return clients.filter(c => {
        if (!c.birthDate) return false
        const parts = c.birthDate.split("-")
        if (parts.length !== 3) return false
        const bM = Number(parts[1])
        const bD = Number(parts[2])

        if (start && end) {
            const sM = start.getMonth() + 1
            const sD = start.getDate()
            const eM = end.getMonth() + 1
            const eD = end.getDate()

            // Se o período estiver dentro do mesmo "ciclo anual" (ex: Jan a Dez)
            // ou se ele cruzar a virada do ano (ex: Dez a Jan)
            const rangeWraps = sM > eM || (sM === eM && sD > eD)

            if (!rangeWraps) {
                // Período normal: início <= fim
                return isAfterOrEqual(bM, bD, sM, sD) && isBeforeOrEqual(bM, bD, eM, eD)
            } else {
                // Período que cruza o ano: maior que início OU menor que fim
                return isAfterOrEqual(bM, bD, sM, sD) || isBeforeOrEqual(bM, bD, eM, eD)
            }
        } else {
            // Se sem filtro, mostra o mês atual
            const targetMonth = new Date().getMonth() + 1
            return bM === targetMonth
        }
    }).sort((a, b) => {
        // Ordenação extra por dia/mês (já que o range pode quebrar a ordem alfabética de interesse)
        const [, am, ad] = a.birthDate.split("-").map(Number)
        const [, bm, bd] = b.birthDate.split("-").map(Number)
        return (am * 100 + ad) - (bm * 100 + bd)
    }).map(c => {
        const [, m, d] = c.birthDate.split("-")
        return {
            ...c,
            referenceLabel: `${d}/${m}`
        }
    })
}

/**
 * Genérico por status de Contrato (Active, Inactive, Suspended, Canceled)
 */
export const listByStatus = async (db, ctx, status, start, end) => {
    const ref = clientContractsCollection(db, ctx)

    // Define qual data filtrar/ordenar
    let dateField = "startDate"
    if (status === 'canceled' || status === 'inactive') {
        dateField = "endDate"
    }

    let q
    if (start && end) {
        const sDate = toYMD(start)
        const eDate = toYMD(end)

        q = query(
            ref,
            where("status", "==", status),
            where(dateField, ">=", sDate),
            where(dateField, "<=", eDate),
            orderBy(dateField, "desc")
        )
    } else {
        q = query(ref, where("status", "==", status), orderBy(dateField, "desc"))
    }

    const snap = await getDocs(q)
    const contracts = mapDocs(snap)

    if (!contracts.length) return []

    const clientIds = [...new Set(contracts.map(c => c.idClient).filter(Boolean))]
    const clients = await hydrateClients(clientIds)

    return clients.map(client => {
        const myContracts = contracts.filter(c => c.idClient === client.id)
        if (!myContracts.length) return null

        const primaryContract = myContracts[0]

        let label = status
        if (status === 'suspended') label = "Suspenso"
        if (status === 'inactive') label = "Inativo"
        if (status === 'canceled') label = "Cancelado"
        if (status === 'active') label = "Ativo"

        if (primaryContract.contractTitle) {
            label += ` · ${primaryContract.contractTitle}`
        }

        // Add date info
        const dVal = primaryContract[dateField]
        if (dVal) {
            const [, m, d] = dVal.split("-")
            label += ` (${d}/${m})`
        }

        return {
            ...client,
            meta: primaryContract,
            referenceLabel: label,
            allContracts: myContracts
        }
    }).filter(Boolean)
}

/**
 * 07. Vencimento de Contratos
 */
export const listContractsDue = async (db, ctx, start, end) => {
    const ref = clientContractsCollection(db, ctx)

    let sDate = toYMD(new Date())
    let eDate = toYMD(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

    if (start) sDate = toYMD(start)
    if (end) eDate = toYMD(end)

    const q = query(
        ref,
        // where("status", "==", "active"), // Removido para mostrar também expirados/suspensos que vencem no período
        where("endDate", ">=", sDate),
        where("endDate", "<=", eDate),
        orderBy("endDate", "asc")
    )

    const snap = await getDocs(q)
    let contracts = mapDocs(snap)

    // Filtrar cancelados (pois a data final do cancelado é a data de saída, não necessariamente vencimento)
    contracts = contracts.filter(c => c.status !== 'canceled')

    if (!contracts.length) return []

    const clientIds = [...new Set(contracts.map(c => c.idClient).filter(Boolean))]
    const clients = await hydrateClients(clientIds)

    return contracts.map(contract => {
        const client = clients.find(c => c.id === contract.idClient)
        if (!client) return null

        const [y, m, d] = (contract.endDate || "").split("-")
        return {
            ...client,
            meta: contract,
            referenceLabel: `Vence em ${d}/${m}/${y}`
        }
    }).filter(Boolean)
}

/**
 * 08. Com Crédito
 */
export const listClientsWithCredit = async (db, ctx) => {
    const ref = clientsCol(db, ctx)
    const q = query(ref, where("walletBalance", ">", 0))
    const snap = await getDocs(q)
    return snap.docs.map(d => {
        const data = d.data()
        return {
            id: d.id,
            ...data,
            referenceLabel: `Crédito: R$ ${Number(data.walletBalance).toFixed(2)}`
        }
    })
}

/**
 * 09. Com Saldo Devedor
 */
export const listClientsWithDebt = async (db, ctx) => {
    const ref = receivablesCol(db, ctx)
    const q = query(
        ref,
        where("status", "==", "open"),
        where("balance", ">", 0)
    )
    const snap = await getDocs(q)
    const debts = mapDocs(snap)

    if (!debts.length) return []

    const clientIds = [...new Set(debts.map(d => d.idClient).filter(Boolean))]
    const clients = await hydrateClients(clientIds)

    const debtMap = {}
    debts.forEach(d => {
        if (!debtMap[d.idClient]) debtMap[d.idClient] = 0
        debtMap[d.idClient] += d.balance
    })

    return clients.filter(c => debtMap[c.id] > 0).map(c => ({
        ...c,
        activeDebt: debtMap[c.id],
        referenceLabel: `Dívida: R$ ${Number(debtMap[c.id]).toFixed(2)}`
    }))
}

/**
 * 10. Com Pendências
 */


/**
 * Helper para buscar dados de clientes por IDs
 */
const hydrateClients = async (ids) => {
    if (!ids.length) return []
    return await listClientsByIdsRepo(ids)
}
