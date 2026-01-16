// src/services/sales/sales.repository.js
// @ts-check

import { collection } from "firebase/firestore"
import { branchCollection, branchDoc } from "../_core/refs"

/** Coleção raiz de vendas */
export const salesCollectionRef = (db, ctx) => branchCollection(db, ctx, "sales")

/** Documento de venda */
export const saleDocRef = (db, ctx, idSale) => branchDoc(db, ctx, "sales", idSale)

/** Subcoleções */
export const saleItemsRef = saleRef => collection(saleRef, "items")
