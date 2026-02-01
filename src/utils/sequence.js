import { doc, runTransaction } from 'firebase/firestore'
import { getFirebaseBackend } from '../helpers/firebase_helper'

/**
 * Sistema Centralizado de Geração de IDs Amigáveis
 * 
 * Padrão Profissional (inspirado em Stripe, Shopify, etc):
 * - IDs incrementais e únicos
 * - Prefixos para identificação visual
 * - Contador Firestore atômico (evita duplicação)
 * 
 * Formato: [PREFIX][SEQUENCIAL_PADDED]
 * Exemplos:
 *   Clientes:   0001, 0002, 0003 (sem prefixo = GYM ID)
 *   Vendas:     V00001, V00002
 *   Contratos:  C00001, C00002
 *   Recebíveis: R00001, R00002
 *   Despesas:   D00001, D00002
 */

/**
 * Função base para gerar IDs amigáveis usando contadores Firestore.
 * @param {string} idTenant - ID do tenant
 * @param {string} idBranch - ID da branch
 * @param {string} counterName - Nome do contador (ex: 'clients', 'sales')
 * @param {object} options - Opções { prefix: '', padding: 5 }
 * @returns {Promise<string>} ID gerado (ex: 'V00001')
 */
export const generateFriendlyId = async (idTenant, idBranch, counterName, { prefix = "", padding = 5 } = {}) => {
    const backend = getFirebaseBackend()
    if (!backend) throw new Error("Firebase não inicializado")

    const db = backend.db
    const counterDocRef = doc(db, `tenants/${idTenant}/branches/${idBranch}/counters/${counterName}`)

    let newNumber = null

    // Transação atômica para evitar IDs duplicados
    await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterDocRef)

        if (counterDoc.exists()) {
            newNumber = (counterDoc.data().lastValue || 0) + 1
            transaction.update(counterDocRef, { lastValue: newNumber })
        } else {
            newNumber = 1
            transaction.set(counterDocRef, { lastValue: 1, createdAt: new Date() })
        }
    })

    if (newNumber === null) {
        throw new Error("Falha ao gerar novo número de sequência.")
    }

    const strSeq = String(newNumber).padStart(padding, '0')
    return prefix ? `${prefix}${strSeq}` : strSeq
}

// =====================================================
// FUNÇÕES ESPECÍFICAS POR ENTIDADE (Best Practice)
// =====================================================

/**
 * Gera GYM ID para cliente (ex: 0001, 0002)
 */
export const generateClientId = (idTenant, idBranch) =>
    generateFriendlyId(idTenant, idBranch, 'clients', { prefix: '', padding: 4 })

/**
 * Gera ID de venda (ex: V00001, V00002)
 */
export const generateSaleId = (idTenant, idBranch) =>
    generateFriendlyId(idTenant, idBranch, 'sales', { prefix: 'V', padding: 5 })

/**
 * Gera ID de contrato (ex: C00001, C00002)
 */
export const generateContractId = (idTenant, idBranch) =>
    generateFriendlyId(idTenant, idBranch, 'clientContracts', { prefix: 'C', padding: 5 })

/**
 * Gera ID de recebível (ex: R00001, R00002)
 */
export const generateReceivableId = (idTenant, idBranch) =>
    generateFriendlyId(idTenant, idBranch, 'receivables', { prefix: 'R', padding: 5 })

/**
 * Gera ID de despesa/pagável (ex: D00001, D00002)
 */
export const generateExpenseId = (idTenant, idBranch) =>
    generateFriendlyId(idTenant, idBranch, 'expenses', { prefix: 'D', padding: 5 })

/**
 * Gera ID de pagável (ex: P00001, P00002)
 */
export const generatePayableId = (idTenant, idBranch) =>
    generateFriendlyId(idTenant, idBranch, 'payables', { prefix: 'P', padding: 5 })
