
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import { requireBranchContext } from "../_core/context"
import { getDb } from "../_core/db"

const getContext = () => requireBranchContext()

/**
 * Salva o resultado de um teste para um aluno.
 * @param {object} params
 * @param {string} params.idTestEvent ID do evento de teste (Evaluation Event)
 * @param {string} params.idclient ID do aluno
 * @param {string} params.testType Tipo do teste ('tempo' ou 'distancia')
 * @param {number|string} params.result Valor do resultado (metros ou segundos/tempo formatado)
 * @param {number} params.numericResult Valor numérico para ranking (metros ou segundos absolutos)
 */
export const saveTestResult = async ({
    idTestEvent,
    idClient,
    testType,
    result,
    numericResult,
    title,
    distanceMeters,
    targetTime
}) => {
    const db = getDb()
    const ctx = getContext()

    if (!ctx.idTenant || !ctx.idBranch) throw new Error("Contexto inválido")

    if (!idClient) throw new Error("ID do aluno/cliente obrigatório")

    const resultRef = doc(
        db,
        "tenants",
        ctx.idTenant,
        "branches",
        ctx.idBranch,
        "testResults",
        `${idTestEvent}_${idClient}`
    )

    const payload = {
        idTestEvent,
        idClient,
        testType,
        result,
        numericResult: Number(numericResult),
        // Snapshot data for easy display in history
        title: title || "",
        distanceMeters: distanceMeters ? Number(distanceMeters) : null,
        targetTime: targetTime || null,
        updatedAt: serverTimestamp()
    }

    await setDoc(resultRef, payload, { merge: true })
    return { id: resultRef.id, ...payload }
}

/**
 * Busca resultados de um evento de teste específico
 */
export const getTestResultsByEvent = async (idTestEvent) => {
    // Implementar busca se necessário, ou usar subcoleção no evento
    // Por enquanto, o foco é salvar.
    return []
}

/**
 * Busca histórico de resultados de testes de um aluno
 */
export const getTestResultsByClient = async (idClient) => {
    const db = getDb()
    const ctx = getContext()

    if (!ctx.idTenant || !ctx.idBranch || !idClient) return []

    const q = query(
        collection(db, "tenants", ctx.idTenant, "branches", ctx.idBranch, "testResults"),
        where("idClient", "==", idClient)
    )

    const snap = await getDocs(q)
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Sort in memory to avoid needing a composite index immediately
    return results.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0
        return timeB - timeA
    })
}
