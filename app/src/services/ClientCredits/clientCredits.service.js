import { clientCreditsCol, getContext, getDb } from "./clientCredits.repository"

export const listClientCredits = async (idClient, { ctxOverride = null } = {}) => {
  const db = getDb()
  const ctx = getContext(ctxOverride)
  const ref = clientCreditsCol(db, ctx, idClient)
  const snap = await getDocs(ref)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addClientCredit = async (idClient, data) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const addClientCreditFn = httpsCallable(functions, 'addClientCredit')

  try {
    const result = await addClientCreditFn({
      ...data,
      idClient,
      idTenant,
      idBranch
    })
    return result.data
  } catch (error) {
    console.error("Erro ao adicionar crédito via função:", error)
    throw error
  }
}

export const consumeClientCredit = async (idClient, idCredit, amount) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const fn = httpsCallable(functions, 'consumeClientCredit')

  try {
    await fn({
      idClient,
      idCredit,
      amount,
      idTenant,
      idBranch
    })
    return true
  } catch (error) {
    console.error("Erro ao consumir crédito via função:", error)
    throw error
  }
}

export const deleteClientCredit = async (idClient, idCredit) => {
  const functions = requireFunctions()
  const { idTenant, idBranch } = requireBranchContext()

  const fn = httpsCallable(functions, 'deleteClientCredit')

  try {
    await fn({
      idClient,
      idCredit,
      idTenant,
      idBranch
    })
    return true
  } catch (error) {
    console.error("Erro ao remover crédito via função:", error)
    throw error
  }
}

export const getClientCreditBalance = async idClient => {
  const credits = await listClientCredits(idClient)
  return credits.reduce((sum, c) => sum + Number(c.balance || 0), 0)
}
