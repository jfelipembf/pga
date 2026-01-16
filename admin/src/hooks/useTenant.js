import { useState, useEffect } from "react";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

/**
 * Hook to listen to a specific tenant's data.
 */
const useTenant = (tenantId) => {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        const db = getFirestore();
        const tenantRef = doc(db, "tenants", tenantId);

        const unsubscribe = onSnapshot(tenantRef, (snapshot) => {
            if (snapshot.exists()) {
                setTenant({ id: snapshot.id, ...snapshot.data() });
            } else {
                setTenant(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching tenant:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [tenantId]);

    return { tenant, loading, error };
};

export default useTenant;
