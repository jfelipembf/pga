// src/services/clients/clients.service.js
import { useMemo } from "react"

import { callFunction } from "../_core/functions"

// Repositories
import {
  listClientsRepo,
  getClientRepo,
  listClientSubcollectionRepo,
  listClientsByIdsRepo,
} from "./clients.repository"

// Adapters
import { financialTxToClientRows, normalizeReceivable } from "./clients.adapters"

// External Modules
import { listEnrollmentsByClient } from "../Enrollments/index"
import { listClientContractsByClient, listClientContracts } from "../ClientContracts"
import { listFinancialTransactions } from "../Financial/index"
import { listReceivablesByClient } from "../Financial"
import { getTestResultsByClient } from "../Tests/tests.service"
import { logNewLead } from "../Funnel/index"
import { usePhotoUpload } from "../../hooks/usePhotoUpload"

/* =========================================================================
   LIST / GET
   ========================================================================= */

export const listClients = async () => listClientsRepo()

export const listClientsByIds = async (clientIds) => listClientsByIdsRepo(clientIds)

export const getClient = async (idClient) => getClientRepo(idClient)

/**
 * Lista clientes que possuem contratos ativos.
 * NOTA: Isso busca todos os contratos do banco. Em escala, isso deve ser movido para uma query otimizada no backend.
 */
export const listActiveClients = async () => {
  const contracts = await listClientContracts()
  const contractList = Array.isArray(contracts) ? contracts : []

  const activeClientIds = new Set()
  for (const c of contractList) {
    if ((c?.status || "").toLowerCase() === "active" && c.idClient) {
      activeClientIds.add(String(c.idClient).trim())
    }
  }

  return await listClientsByIds(Array.from(activeClientIds))
}

/* =========================================================================
   ACTIONS (Create / Update)
   ========================================================================= */

/**
 * Creates a new client.
 * Backend handles validation and payload construction.
 */
export const createClient = async (data, { ctxOverride = null } = {}) => {
  const resultData = await callFunction("createClient", { clientData: data }, { ctxOverride })

  // Log in Funnel (Side Effect)
  if (resultData?.id) {
    await logNewLead(resultData.id, { createdBy: 'system' }).catch(console.warn)
  }

  return resultData
}

/**
 * Updates an existing client.
 * Backend handles validation and payload construction.
 */
export const updateClient = async (idClient, data) => {
  return await callFunction("updateClient", { idClient, clientData: data })
}

/* =========================================================================
   SUB-COLLECTIONS & AGGREGATED DATA
   ========================================================================= */

// Atalhos para subcoleções
export const getClientEvaluations = (clientId) => listClientSubcollectionRepo(clientId, "evaluations")
export const getClientPresences = (clientId) => listClientSubcollectionRepo(clientId, "attendance")
export const getClientAttendanceMonthly = (clientId) => listClientSubcollectionRepo(clientId, "attendanceMonthly")
export const getClientTests = (clientId) => getTestResultsByClient(clientId)
export const getClientContracts = (clientId) => listClientContractsByClient(clientId)
export const getClientEnrollments = (clientId) => listEnrollmentsByClient(clientId)

/**
 * Retorna o extrato financeiro unificado (Transações + Dívidas em Aberto)
 */
export const getClientFinancial = async (clientId) => {
  const [txs, receivables] = await Promise.all([
    listFinancialTransactions({ idClient: clientId, limit: 1000 }), // Atenção ao limite em produção
    listReceivablesByClient(clientId, { status: "open" }),
  ])

  const txRows = financialTxToClientRows(txs)
  const rcvMap = new Map()

  // Mapeia os receivables para acesso rápido e cálculo de pendências
  if (Array.isArray(receivables)) {
    for (const r of receivables) {
      if (!r.idSale) continue

      const normalized = normalizeReceivable(r)
      // Indexamos pelo ID do receivable para garantir unicidade e não sobrescrever parcelas.
      // O merge com transações ocorrerá apenas se houver identidade de IDs.
      rcvMap.set(r.id, normalized)
    }
  }

  // Mescla Transações com dados de Recebíveis (apenas quando há match estrito)
  const merged = txRows.map(tx => {
    // Busca receivable exato (1:1)
    const rcv = rcvMap.get(tx.id)

    // Tratamento visual para pagamentos de dívida (inverte sinal)
    if (tx.type === 'receivablePayment') {
      const absAmount = Math.abs(Number(tx.amount || 0))
      return { ...tx, amount: absAmount, paid: absAmount, pending: 0, status: "paid" }
    }

    const amount = Number(tx.amount || 0)

    // Regra de consistência: Se tem receivable linkado, usa os dados dele. Se não, usa os da transação.
    const paid = rcv ? Number(rcv.paid || 0) : amount
    const pending = rcv ? Number(rcv.pending || 0) : 0

    return {
      ...tx,
      amount,
      paid,
      pending,
      status: rcv ? rcv.status : "paid"
    }
  })

  // Adiciona outstanding debts (dívidas que não foram capturadas/linkadas acima)
  const outstandingDebts = Array.from(rcvMap.values()).filter(
    rcv => !merged.some(m => m.id === rcv.id)
  )

  const rows = [...merged, ...outstandingDebts]
  // Ordenação decrescente por data
  rows.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))

  return rows
}

/**
 * Busca todos os dados do cliente de forma paralela e resiliente.
 * Usa Promise.allSettled para garantir que falhas secundárias não quebrem a página.
 */
export const getClientAggregated = async (clientId) => {
  // A busca do cliente é crítica, falha se der erro.
  const client = await getClient(clientId)
  if (!client) throw new Error("Cliente não encontrado")

  // As demais são secundárias. Se falharem, retornam array vazio.
  const results = await Promise.allSettled([
    getClientContracts(clientId),
    getClientEnrollments(clientId),
    getClientFinancial(clientId),
    getClientEvaluations(clientId),
    getClientTests(clientId),
    getClientPresences(clientId),
    getClientAttendanceMonthly(clientId),
  ])

  // Helper para extrair valor ou fallback
  const getVal = (index) => (results[index].status === "fulfilled" ? results[index].value : [])

  const [
    contracts,
    enrollments,
    financial,
    evaluations,
    tests,
    presences,
    attendanceMonthlyRaw
  ] = results.map((_, i) => getVal(i))

  const attendanceMonthly = Array.isArray(attendanceMonthlyRaw) ? attendanceMonthlyRaw : []
  attendanceMonthly.sort((a, b) => String(a.month || a.id || "").localeCompare(String(b.month || b.id || "")))

  return {
    client,
    contracts,
    enrollments,
    financial,
    evaluations,
    tests,
    presences,
    attendanceMonthly
  }
}

/* =========================================================================
   HOOKS
   ========================================================================= */

export const useClientAvatarUpload = () => {
  const { uploadPhoto, uploading, error } = usePhotoUpload({ entity: "clients" })

  const uploadAvatar = useMemo(() => {
    return async (file, options = {}) => {
      const { ctxOverride } = options
      const res = await uploadPhoto(file, { filenamePrefix: "avatar", ctxOverride })
      return res?.url || ""
    }
  }, [uploadPhoto])

  return { uploadAvatar, uploading, error }
}
