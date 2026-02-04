import { useState, useCallback, useRef } from 'react'

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

        if (cached) {
            setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }))
            return cached
        }

        setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }))
        return null
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
        setCacheStats({ hits: 0, misses: 0 })
    }, [])

    /**
     * Invalida cache de uma semana específica
     */
    const invalidate = useCallback((referenceDate) => {
        const key = getWeekKey(referenceDate)
        cacheRef.current.delete(key)
    }, [getWeekKey])

    return {
        get,
        set,
        cleanup,
        clear,
        invalidate,
        cacheStats,
        size: cacheRef.current.size
    }
}
