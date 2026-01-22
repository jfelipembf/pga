import { collection, doc } from "firebase/firestore"
import { requireDb } from "../_core/db"

export const financialTransactionsCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "financialTransactions")

export const financialTransactionDoc = (db, ctx, id) =>
    doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "financialTransactions", String(id))

export const cashierSessionsCol = (db, ctx) =>
    collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "cashierSessions")

export const getDb = () => requireDb()
export { getContext } from "../_core/context"
