import { collection, doc } from "firebase/firestore"
import { requireBranchContext } from "../_core/context"
import { requireDb } from "../_core/db"

/**
 * Collection Path:
 * tenants/{tenantId}/branches/{branchId}/clients/{clientId}/funnelEvents
 */
export const funnelEventsCollectionRef = (db, ctx, clientId) => {
    return collection(
        db,
        "tenants",
        ctx.idTenant,
        "branches",
        ctx.idBranch,
        "clients",
        clientId,
        "funnelEvents"
    )
}

export const funnelEventDocRef = (db, ctx, clientId, eventId) => {
    return doc(funnelEventsCollectionRef(db, ctx, clientId), eventId)
}

export const getDb = () => requireDb()
export const getContext = () => requireBranchContext()
