// src/services/clients/clients.service.js
import { useMemo } from "react"
import { buildClientPayload } from "../payloads"
import {
  listClientsRepo,
  getClientRepo,
  listClientSubcollectionRepo,
  listClientsByIdsRepo,
} from "./clients.repository"
import { financialTxToClientRows } from "./clients.adapters"
import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"
import { requireBranchContext } from "../_core/context"

// módulos “centrais” (fora do cliente)
import { listEnrollmentsByClient } from "../Enrollments/index"
import { listClientContractsByClient } from "../ClientContracts"
import { listClientContracts } from "../ClientContracts"
import { listFinancialTransactions } from "../Financial/index"
import { listReceivablesByClient } from "../Receivables"
import { getTestResultsByClient } from "../Tests/tests.service"

// FUNNEL INTEGRATION
import { logNewLead } from "../Funnel/index"

import { usePhotoUpload } from "../../hooks/usePhotoUpload"

/** LIST */
export const listClients = async () => listClientsRepo()

export const listClientsByIds = async clientIds => listClientsByIdsRepo(clientIds)

export const listActiveClients = async () => {
  const contracts = await listClientContracts()
  const activeClientIds = Array.from(
    new Set(
      (Array.isArray(contracts) ? contracts : [])
        .filter(c => (c?.status || "").toLowerCase() === "active")
        .map(c => String(c.idClient || "").trim())
        .filter(Boolean)
    )
  )

  return await listClientsByIds(activeClientIds)
}

/** GET */
export const getClient = async idClient => getClientRepo(idClient)


/** CREATE */
export const createClient = async (data, { ctxOverride = null } = {}) => {
  const functions = requireFunctions()
  const ctx = ctxOverride || requireBranchContext()

  if (!ctx?.idTenant || !ctx?.idBranch) {
    throw new Error("Contexto de tenant/unidade não encontrado")
  }

  // Sanitizar payload
  const payload = buildClientPayload(data)

  const createClientFn = httpsCallable(functions, "createClient")

  try {
    const result = await createClientFn({
      idTenant: ctx.idTenant,
      idBranch: ctx.idBranch,
      clientData: payload,
    })

    // [FUNNEL] Log New Lead
    if (result.data?.id) {

      await logNewLead(result.data.id, { createdBy: 'system' })
    }

    return result.data
  } catch (error) {
    console.error("Erro ao criar cliente via função:", error)
    throw error
  }
}

/** CREATE PUBLIC (No Auth) */
export const createPublicClient = async (data, { ctxOverride = null } = {}) => {
  const functions = requireFunctions()
  const ctx = ctxOverride || {}

  if (!ctx.idTenant || !ctx.idBranch) {
    throw new Error("Contexto de tenant/unidade obrigatório para cadastro público")
  }

  // Sanitizar payload
  const payload = buildClientPayload(data)
  payload.status = "lead"

  const createFn = httpsCallable(functions, "createPublicClient")

  try {
    const result = await createFn({
      idTenant: ctx.idTenant,
      idBranch: ctx.idBranch,
      clientData: payload,
    })

    return result.data
  } catch (error) {
    console.error("Erro ao criar cliente público via função:", error)
    throw error
  }
}

/** UPDATE */
export const updateClient = async (idClient, data) => {
  const functions = requireFunctions()
  const ctx = requireBranchContext()

  if (!ctx?.idTenant || !ctx?.idBranch) {
    throw new Error("Contexto de tenant/unidade não encontrado")
  }

  const updateClientFn = httpsCallable(functions, "updateClient")

  try {
    const result = await updateClientFn({
      idTenant: ctx.idTenant,
      idBranch: ctx.idBranch,
      idClient,
      clientData: data,
    })
    return result.data
  } catch (error) {
    console.error("Erro ao atualizar cliente via função:", error)
    throw error
  }
}

/** Subcoleções “do cliente” */
export const getClientEvaluations = async clientId => listClientSubcollectionRepo(clientId, "evaluations")
export const getClientTests = async clientId => getTestResultsByClient(clientId)
export const getClientPresences = async clientId => listClientSubcollectionRepo(clientId, "attendance")
export const getClientAttendanceMonthly = async clientId =>
  listClientSubcollectionRepo(clientId, "attendanceMonthly")

/** Coleções centrais (unidade) */
export const getClientContracts = async clientId => listClientContractsByClient(clientId)
export const getClientEnrollments = async clientId => listEnrollmentsByClient(clientId)

/**
 * Financeiro do cliente deve vir de financialTransactions (unificado).
 * (Se ainda estiver em migração, dá pra criar fallback p/ sales depois.)
 */
export const getClientFinancial = async clientId => {
  const [txs, receivables] = await Promise.all([
    listFinancialTransactions({ idClient: clientId, limit: 1000 }),
    listReceivablesByClient(clientId, { status: "open" }),
  ])

  const txRows = financialTxToClientRows(txs)
  const rcvMap = new Map()

    ; (receivables || []).forEach(r => {
      const idSale = r.idSale
      if (!idSale) return
      const amount = Number(r.amount || 0)
      const paid = Number(r.amountPaid || 0)
      const pending = Math.max(amount - paid, 0)

      rcvMap.set(idSale, {
        id: r.id,
        idTransaction: r.receivableCode || r.id,
        date: r.dueDate || null,
        type: "receivable",
        description: r.description || "Recebível",
        amount,
        paid,
        pending,
        status: r.status || "open",
        method: r.paymentType ? { type: r.paymentType } : null,
        raw: r,
      })
    })

  // Unifica dados da transação (Venda) com o Recebível (Saldo Devedor)
  const merged = txRows.map(tx => {
    const rcv = rcvMap.get(tx.id) || rcvMap.get(tx.raw?.idSale)

    // FIX: Tratamento especial para pagamentos de dívida (receivablePayment)
    // Eles vêm negativos do backend (saída do cliente), mas no extrato visual queremos ver o RECIBO (positivo).
    if (tx.type === 'receivablePayment') {
      const absAmount = Math.abs(Number(tx.amount || 0))
      return {
        ...tx,
        amount: absAmount,
        paid: absAmount,
        pending: 0,
        status: "paid"
      }
    }

    // Conforme o Payload unificado:
    // amount = valor total contratado
    // paid = valor já pago
    // pending = saldo devedor (amount - paid)
    const amount = Number(tx.amount || 0)
    // FIX: Ler paid de metadata.totals.paid se não houver amountPaid na raiz
    const paid = Number(rcv?.paid || tx.raw?.amountPaid || tx.raw?.metadata?.totals?.paid || 0)
    // FIX: Se não houver receivable, assume quitado (sem estimativas)
    const pending = rcv ? Number(rcv.pending || 0) : 0

    return {
      ...tx,
      amount,
      paid,
      pending,
      status: rcv ? rcv.status : "paid"
    }
  })

  // Adiciona orphan receivables (gerados sem venda direta)
  const orphanReceivables = Array.from(rcvMap.values()).filter(
    rcv => !merged.some(m => m.id === rcv.raw.idSale || m.raw?.idSale === rcv.raw.idSale)
  )

  const rows = [...merged, ...orphanReceivables]
  rows.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))

  return rows
}

/** Agregado */
export const getClientAggregated = async clientId => {
  // Helper to suppress errors on secondary data
  const safeReq = (promise) => promise.catch(err => {
    console.warn("Error fetching aggregated data:", err)
    return []
  })

  const [client, contracts, enrollments, financial, evaluations, tests, presences, attendanceMonthly] = await Promise.all([
    getClient(clientId),
    safeReq(getClientContracts(clientId)),
    safeReq(getClientEnrollments(clientId)),
    safeReq(getClientFinancial(clientId)),
    safeReq(getClientEvaluations(clientId)),
    safeReq(getClientTests(clientId)),
    safeReq(getClientPresences(clientId)),
    safeReq(getClientAttendanceMonthly(clientId)),
  ])

  const monthly = Array.isArray(attendanceMonthly) ? attendanceMonthly : []
  monthly.sort((a, b) => String(a.month || a.id || "").localeCompare(String(b.month || b.id || "")))

  return { client, contracts, enrollments, financial, evaluations, tests, presences, attendanceMonthly: monthly }
}

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
