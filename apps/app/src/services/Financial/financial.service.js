import { getDoc, getDocs, query, orderBy, limit, where } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"
import { requireBranchContext } from "../_core/context"
import { formatDateString, getToday } from "../../helpers/date"
import { financialTransactionsCol, financialTransactionDoc, getContext, getDb } from "./financial.repository"
import { buildFinancialTransactionPayload, TransactionType } from "../payloads"

export const listFinancialTransactions = async ({
  type = null,
  saleType = null,
  source = null,
  dateRange = null,
  idClient = null,
  category = null,
  limit: limitCount = 100,
  orderBy: orderByField = "date",
  orderDirection = "desc",
  ctxOverride = null,
} = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = financialTransactionsCol(db, ctx)

  let queryConstraints = []

  if (idClient) {
    queryConstraints.push(where("idClient", "==", String(idClient)))
  } else {
    queryConstraints.push(orderBy(orderByField, orderDirection === "desc" ? "desc" : "asc"))
  }

  if (limitCount > 0) {
    queryConstraints.push(limit(limitCount > 1000 ? 1000 : limitCount))
  }

  const q = query(ref, ...queryConstraints)
  const snap = await getDocs(q)

  let transactions = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }))

  if (type) {
    transactions = transactions.filter(tx => tx.type === type)
  }
  if (saleType) {
    transactions = transactions.filter(tx => tx.saleType === saleType)
  }
  if (source) {
    transactions = transactions.filter(tx => tx.source === source)
  }
  if (category) {
    transactions = transactions.filter(tx => tx.category === category)
  }

  // Sort in memory if idClient was used (as we likely skipped query orderBy to avoid composite index)
  if (idClient) {
    transactions.sort((a, b) => {
      const valA = a[orderByField] || ""
      const valB = b[orderByField] || ""
      return orderDirection === "desc"
        ? String(valB).localeCompare(String(valA))
        : String(valA).localeCompare(String(valB))
    })
  }

  if (dateRange && (dateRange.start || dateRange.end)) {
    transactions = transactions.filter(tx => {
      if (!tx.date) return false
      if (dateRange.start && dateRange.end) {
        return tx.date >= dateRange.start && tx.date <= dateRange.end
      }
      if (dateRange.start) {
        return tx.date >= dateRange.start
      }
      return true
    })
  }

  if (limitCount > 0 && transactions.length > limitCount) {
    transactions = transactions.slice(0, limitCount)
  }

  return transactions
}

export const getFinancialTransaction = async (idTransaction, { ctxOverride = null } = {}) => {
  if (!idTransaction) return null

  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = financialTransactionDoc(db, ctx, idTransaction)
  const snap = await getDoc(ref)

  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const updateFinancialTransaction = async (idTransaction, data) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const fn = httpsCallable(functions, 'updateFinancialTransaction')

  try {
    const result = await fn({
      idTransaction,
      ...data,
      idTenant,
      idBranch
    })
    return result.data
  } catch (error) {
    console.error("Erro ao atualizar transação via função:", error)
    throw error
  }
}

export const deleteFinancialTransaction = async idTransaction => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const fn = httpsCallable(functions, 'deleteFinancialTransaction')

  try {
    await fn({
      idTransaction,
      idTenant,
      idBranch
    })
    return true
  } catch (error) {
    console.error("Erro ao remover transação via função:", error)
    throw error
  }
}

export const getFinancialSummary = async ({ dateRange = null } = {}) => {
  const transactions = await listFinancialTransactions({
    dateRange,
    limit: 1000,
  })

  const summary = {
    totalRevenue: 0,
    totalExpenses: 0,
    totalBalance: 0,
    byType: {},
    byCategory: {},
    bySaleType: {},
    bySource: {},
    byMethod: {},
    count: transactions.length,
  }

  transactions.forEach(tx => {
    const amount = Number(tx.amount || 0)

    if (tx.type === "sale") {
      summary.totalRevenue += amount
    } else if (tx.type === "expense") {
      summary.totalExpenses += amount
    }

    summary.byType[tx.type] = (summary.byType[tx.type] || 0) + amount
    summary.byCategory[tx.category] = (summary.byCategory[tx.category] || 0) + amount
    summary.byMethod[tx.method] = (summary.byMethod[tx.method] || 0) + amount
    summary.bySource[tx.source] = (summary.bySource[tx.source] || 0) + amount

    if (tx.saleType) {
      summary.bySaleType[tx.saleType] = (summary.bySaleType[tx.saleType] || 0) + amount
    }
  })

  summary.totalBalance = summary.totalRevenue - summary.totalExpenses

  return summary
}

export const getTodayTransactions = async () => {
  const today = formatDateString(getToday())

  return await listFinancialTransactions({
    dateRange: { start: today, end: today },
    limit: 100,
    orderBy: "createdAt",
    orderDirection: "desc",
  })
}

export const addSaleRevenue = async (payload) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const addSaleRevenueFn = httpsCallable(functions, 'addSaleRevenue')

  try {
    const data = buildFinancialTransactionPayload({ ...payload, type: TransactionType.SALE })
    const result = await addSaleRevenueFn({
      ...data,
      idTenant,
      idBranch
    })
    return result.data
  } catch (error) {
    console.error("Erro ao registrar receita via função:", error)
    throw error
  }
}

export const addExpense = async (payload) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const addExpenseFn = httpsCallable(functions, 'addExpense')

  try {
    const data = buildFinancialTransactionPayload({ ...payload, type: TransactionType.EXPENSE })
    const result = await addExpenseFn({
      ...data,
      idTenant,
      idBranch
    })
    return result.data
  } catch (error) {
    console.error("Erro ao registrar despesa via função:", error)
    throw error
  }
}
