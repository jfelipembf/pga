import { useState, useEffect } from "react";
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "firebase/firestore";
import { getFirebaseBackend } from "../../../helpers/firebase_helper";

export const usePerformanceMonitoring = () => {
    const [performanceLogs, setPerformanceLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        good: 0,
        average: 0,
        slow: 0,
        avgDuration: 0
    });

    useEffect(() => {
        const backend = getFirebaseBackend();
        if (!backend) return;

        const q = query(
            collection(backend.firestore, "_monitoring_performance"),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));

            setPerformanceLogs(logs);

            // Calculate stats
            if (logs.length > 0) {
                const total = logs.length;
                const good = logs.filter(l => l.category === "good").length;
                const average = logs.filter(l => l.category === "average").length;
                const slow = logs.filter(l => l.category === "slow").length;
                const avgDuration = logs.reduce((acc, curr) => acc + curr.duration, 0) / total;

                setStats({
                    good: Math.round((good / total) * 100),
                    average: Math.round((average / total) * 100),
                    slow: Math.round((slow / total) * 100),
                    avgDuration: Math.round(avgDuration)
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return {
        performanceLogs,
        loading,
        stats
    };
};
