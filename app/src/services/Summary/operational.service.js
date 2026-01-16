import { getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { requireDb } from "../_core/db"
import { requireBranchContext } from "../_core/context"
import { salesCollectionRef } from "../Sales/sales.repository"
import { enrollmentsCol } from "../Enrollments/enrollments.repository"
import { formatDateString } from "../../helpers/date"

/**
 * Busca estatísticas de vendas do staff logado para hoje.
 */
export const getStaffDailyStats = async (uid) => {
    const db = requireDb()
    const ctx = requireBranchContext()
    const today = formatDateString(new Date())

    const salesRef = salesCollectionRef(db, ctx)
    const q = query(
        salesRef,
        where("idStaff", "==", uid),
        where("saleDate", "==", today)
    )

    const snap = await getDocs(q)
    const sales = snap.docs.map(d => d.data())

    const totalCount = sales.length
    const totalAmount = sales.reduce((acc, s) => acc + (Number(s.totals?.net || 0)), 0)

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
    const monthId = now.toISOString().slice(0, 7) // YYYY-MM

    const salesRef = salesCollectionRef(db, ctx)
    const startOfMonth = `${monthId}-01`
    const endOfMonth = `${monthId}-31`

    const q = query(
        salesRef,
        where("idStaff", "==", uid),
        where("saleDate", ">=", startOfMonth),
        where("saleDate", "<=", endOfMonth)
    )

    const snap = await getDocs(q)
    const sales = snap.docs.map(d => d.data())

    const totalCount = sales.length
    const totalAmount = sales.reduce((acc, s) => acc + (Number(s.totals?.net || 0)), 0)

    return {
        totalCount,
        totalAmount
    }
}

/**
 * Lista aulas experimentais do dia para o staff logado.
 */
export const getStaffDailyExperimentals = async (uid) => {
    const db = requireDb()
    const ctx = requireBranchContext()
    const today = formatDateString(new Date())

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
    const monthId = now.toISOString().slice(0, 7) // YYYY-MM
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
