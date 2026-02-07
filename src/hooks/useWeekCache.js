import { useState, useCallback, useRef, useMemo } from 'react'

/**
 * Hook para cache de dados de sessões por semana
 * Evita recarregar dados de semanas já visitadas
 */
export const useWeekCache = () => {
    const cacheRef = useRef(new Map())
    const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 })

    /**
     * Gera chave única para a semana
     * @param {Date|string} referenceDate - Data de referência
     * @returns {string} Chave no formato YYYY-Www (ex: 2026-W05)
     */
    const getWeekKey = useCallback((referenceDate) => {
        const date = referenceDate instanceof Date ? referenceDate : new Date(referenceDate)
        const year = date.getFullYear()
        const week = getWeekNumber(date)
        return `${year}-W${String(week).padStart(2, '0')}`
    }, [])

    /**
     * Calcula o número da semana no ano
     */
    const getWeekNumber = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
        const dayNum = d.getUTCDay() || 7
        d.setUTCDate(d.getUTCDate() + 4 - dayNum)
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    }

    /**
     * Busca dados do cache
     */
    const get = useCallback((referenceDate) => {
        const key = getWeekKey(referenceDate)
        const cached = cacheRef.current.get(key)

        // Removido setCacheStats para evitar loop de renderização (side-effect em leitura)
        return cached || null
    }, [getWeekKey])

    /**
     * Salva dados no cache
     */
    const set = useCallback((referenceDate, data) => {
        const key = getWeekKey(referenceDate)
        cacheRef.current.set(key, {
            data,
            timestamp: Date.now()
        })
    }, [getWeekKey])

    /**
     * Limpa cache antigo (mais de 1 hora)
     */
    const cleanup = useCallback(() => {
        const now = Date.now()
        const maxAge = 60 * 60 * 1000 // 1 hora

        for (const [key, value] of cacheRef.current.entries()) {
            if (now - value.timestamp > maxAge) {
                cacheRef.current.delete(key)
            }
        }
    }, [])

    /**
     * Limpa todo o cache
     */
    const clear = useCallback(() => {
        cacheRef.current.clear()
        // Removido setCacheStats para evitar re-render desnecessário
    }, [])

    /**
     * Invalida cache de uma semana específica
     */
    const invalidate = useCallback((referenceDate) => {
        const key = getWeekKey(referenceDate)
        cacheRef.current.delete(key)
    }, [getWeekKey])

    // Memoize o retorno para garantir estabilidade referencial
    return useMemo(() => ({
        get,
        set,
        cleanup,
        clear,
        invalidate,
        // Removido cacheStats do retorno para simplificar e evitar re-renders
        size: cacheRef.current.size
    }), [get, set, cleanup, clear, invalidate])
}
