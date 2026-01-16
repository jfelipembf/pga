import { useState, useEffect } from "react";
import { getFirestore, collection, onSnapshot, query } from "firebase/firestore";
import { useToast } from "../../../components/Common/ToastProvider";

const useBranchStaff = (tenantId, branchId) => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToast } = useToast();

    useEffect(() => {
        if (!tenantId || !branchId) {
            setLoading(false);
            return;
        }

        const db = getFirestore();
        // Path: tenants/{tenantId}/branches/{branchId}/staff
        const staffRef = collection(db, "tenants", tenantId, "branches", branchId, "staff");

        const q = query(staffRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setStaff(list);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching branch staff:", err);
            setError(err);
            setLoading(false);
            addToast({ title: "Erro", message: "Erro ao carregar staff da unidade.", color: "danger" });
        });

        return () => unsubscribe();
    }, [tenantId, branchId, addToast]);

    return {
        staff,
        loading,
        error
    };
};

export default useBranchStaff;
