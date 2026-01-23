import { useState, useEffect, useMemo } from "react"
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"

export const usePerformanceLogs = () => {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const db = getFirestore()
        // Query last 100 logs
        const q = query(
            collection(db, "_monitoring_performance"),
            orderBy("timestamp", "desc"),
            limit(100)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert timestamp to Date object if needed
                date: doc.data().timestamp?.toDate() || new Date()
            }))
            setLogs(data)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const stats = useMemo(() => {
        if (!logs.length) return { avgDuration: 0, errorRate: 0, totalCalls: 0 }

        const totalCalls = logs.length
        const totalDuration = logs.reduce((acc, log) => acc + (log.duration || 0), 0)
        const errorCount = logs.filter(log => log.status === "ERROR").length

        // Calculate slow requests (> 2s)
        const slowCount = logs.filter(log => log.duration > 2000).length

        return {
            avgDuration: Math.round(totalDuration / totalCalls),
            errorRate: ((errorCount / totalCalls) * 100).toFixed(1),
            slowRate: ((slowCount / totalCalls) * 100).toFixed(1),
            totalCalls
        }
    }, [logs])

    return { logs, stats, loading }
}
