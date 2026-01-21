import { getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"
import { salesCollectionRef } from "../Sales/sales.repository"
import { enrollmentsCol } from "../Enrollments/enrollments.repository"
import { financialTransactionsCol } from "../Financial/financial.repository"
import { toISODate } from "@pga/shared"
import { toMonthKey } from "../../utils/date"

/**
 * Busca estatísticas de vendas do staff logado para hoje.
 */
export const getStaffDailyStats = async (uid) => {
    const db = requireDb()
    const ctx = requireBranchContext()
    const today = toISODate(new Date())

    const salesRef = salesCollectionRef(db, ctx)

    // Query 1: Sales where I am the assigned Staff
    const qStaff = query(
        salesRef,
        where("idStaff", "==", uid),
        where("saleDate", "==", today)
    )

    // Query 2: Sales created by me (even if not assigned)
    const qCreated = query(
        salesRef,
        where("createdBy", "==", uid),
        where("saleDate", "==", today)
    )

    const [snapStaff, snapCreated] = await Promise.all([
        getDocs(qStaff),
        getDocs(qCreated).catch(e => ({ docs: [] }))
    ])

    // Deduplicate by ID
    const salesMap = new Map()
    snapStaff.docs.forEach(d => salesMap.set(d.id, d.data()))
    snapCreated.docs.forEach(d => salesMap.set(d.id, d.data()))

    const sales = Array.from(salesMap.values())

    const totalCount = sales.length
    const totalAmount = sales.reduce((acc, s) => acc + (Number(s.totals?.net) || 0), 0)

    return {
        totalCount,
        totalAmount
    }
}

/**
 * Busca estatísticas de vendas do staff logado para o mês atual.
 */
export const getStaffMonthlyStats = async (uid) => {
    const db = requireDb()
    const ctx = requireBranchContext()
    const now = new Date()
    const monthId = toMonthKey(toISODate(now))
    const startOfMonth = `${monthId}-01`
    const endOfMonth = `${monthId}-31`

    const salesRef = salesCollectionRef(db, ctx)
    const txRef = financialTransactionsCol(db, ctx)

    // SALES Queries
    // Query 1: Sales where I am the assigned Staff
    const qStaff = query(
        salesRef,
        where("idStaff", "==", uid),
        where("saleDate", ">=", startOfMonth),
        where("saleDate", "<=", endOfMonth)
    )

    // Query 2: Sales created by me
    const qCreated = query(
        salesRef,
        where("createdBy", "==", uid),
        where("saleDate", ">=", startOfMonth),
        where("saleDate", "<=", endOfMonth)
    )

    // REFUNDS Query
    const qRefunds = query(
        txRef,
        where("type", "==", "expense"),
        where("metadata.uid", "==", uid),
        where("date", ">=", startOfMonth),
        where("date", "<=", endOfMonth)
    )

    const [snapStaff, snapCreated, snapRefunds] = await Promise.all([
        getDocs(qStaff),
        getDocs(qCreated).catch(e => ({ docs: [] })),
        getDocs(qRefunds).catch(e => ({ docs: [] }))
    ])

    // Deduplicate Sales
    const salesMap = new Map()
    snapStaff.docs.forEach(d => salesMap.set(d.id, d.data()))
    snapCreated.docs.forEach(d => salesMap.set(d.id, d.data()))

    const sales = Array.from(salesMap.values())
    const grossAmount = sales.reduce((acc, s) => acc + (Number(s.totals?.net) || 0), 0)

    // Calculate Refunds
    const refunds = snapRefunds.docs
        .map(d => d.data())
        .filter(t => (t.category || "").includes("Estorno") || (t.description || "").includes("Reembolso") || (t.metadata?.reason === "Refund"))

    const refundAmount = refunds.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)

    const totalCount = sales.length
    const totalAmount = grossAmount - refundAmount

    return {
        totalCount,
        totalAmount,
        grossAmount,
        refundAmount
    }
}

/**
 * Lista aulas experimentais do dia para o staff logado.
 */
export const getStaffDailyExperimentals = async (uid) => {
    const db = requireDb()
    const ctx = requireBranchContext()
    const today = toISODate(new Date())

    const enrollRef = enrollmentsCol(db, ctx)
    const q = query(
        enrollRef,
        where("idStaff", "==", uid)
    )

    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e =>
            e.type === 'experimental' &&
            e.status === 'active' &&
            e.sessionDate >= today
        )
        .sort((a, b) => (a.sessionDate || "").localeCompare(b.sessionDate || ""))
}

/**
 * Lista aulas experimentais do MÊS para o staff logado.
 */
export const getStaffMonthlyExperimentals = async (uid) => {
    const db = requireDb()
    const ctx = requireBranchContext()
    const now = new Date()
    const monthId = toMonthKey(toISODate(now))
    const startOfMonth = `${monthId}-01`
    const endOfMonth = `${monthId}-31`

    const enrollRef = enrollmentsCol(db, ctx)
    const q = query(
        enrollRef,
        where("idStaff", "==", uid)
    )

    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e =>
            e.type === 'experimental' &&
            e.status === 'active' &&
            e.sessionDate >= startOfMonth &&
            e.sessionDate <= endOfMonth
        )
        .sort((a, b) => (a.sessionDate || "").localeCompare(b.sessionDate || ""))
}

/**
 * Busca o resumo diário de aniversariantes (cache).
 */
export const getBirthdaySummary = async () => {
    const db = requireDb()
    const ctx = requireBranchContext()

    try {
        const ref = doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "operationalSummary", "birthdays")
        const snap = await getDoc(ref)

        if (snap.exists()) {
            return snap.data().list || []
        }
        return []
    } catch (error) {
        console.error("Error fetching birthday summary:", error)
        return []
    }
}

/**
 * Busca o resumo diário de vencimentos (cache).
 */
export const getExpirationSummary = async () => {
    const db = requireDb()
    const ctx = requireBranchContext()

    try {
        const ref = doc(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "operationalSummary", "expirations")
        const snap = await getDoc(ref)

        if (snap.exists()) {
            return snap.data().list || []
        }
        return []
    } catch (error) {
        console.error("Error fetching expiration summary:", error)
        return []
    }
}
