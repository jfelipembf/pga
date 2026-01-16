// src/services/contracts/clientContracts.repository.js

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore"

/**
 * Contratos do CLIENTE (instâncias).
 * Collection: clientsContracts
 * Subcollection: suspensions
 */

export const clientContractsCollection = (db, ctx) =>
  collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clientsContracts")

export const clientContractRef = (db, ctx, idClientContract) =>
  doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "clientsContracts", idClientContract)

export const suspensionsCollection = (db, ctx, idClientContract) =>
  collection(
    db,
    "tenants",
    ctx.idTenant,
    "branches",
    ctx.idBranch,
    "clientsContracts",
    idClientContract,
    "suspensions"
  )

export const suspensionRef = (db, ctx, idClientContract, idSuspension) =>
  doc(
    db,
    "tenants",
    ctx.idTenant,
    "branches",
    ctx.idBranch,
    "clientsContracts",
    idClientContract,
    "suspensions",
    idSuspension
  )

export const listClientContracts = async (db, ctx) => {
  const snap = await getDocs(clientContractsCollection(db, ctx))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Sem índice composto: busca por idClient e ordena no cliente.
 * (Se quiser otimizar depois: query(where("idClient","==",clientId), orderBy("createdAt","desc")) + índice)
 */
export const listClientContractsByClient = async (db, ctx, clientId) => {
  if (!clientId) return []
  const ref = clientContractsCollection(db, ctx)
  const snap = await getDocs(query(ref, where("idClient", "==", clientId)))

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTs = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
      const bTs = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
      return bTs - aTs
    })
}

export const getClientContract = async (db, ctx, idClientContract) => {
  if (!idClientContract) return null
  const ref = clientContractRef(db, ctx, idClientContract)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const listContractSuspensions = async (db, ctx, idClientContract) => {
  if (!idClientContract) return []
  const ref = suspensionsCollection(db, ctx, idClientContract)
  const snap = await getDocs(query(ref, orderBy("startDate", "desc")))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
