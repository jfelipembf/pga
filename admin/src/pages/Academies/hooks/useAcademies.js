import { useState, useEffect, useCallback } from "react";
import { getFirestore, collectionGroup, onSnapshot, query } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useToast } from "../../../components/Common/ToastProvider";

const useAcademies = () => {
    const [academies, setAcademies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToast } = useToast();

    const functions = getFunctions();
    const createAcademyFunction = httpsCallable(functions, 'createAcademy');
    const checkSlugFunction = httpsCallable(functions, 'checkSlug');
    const updateAcademyFunction = httpsCallable(functions, 'updateAcademy');

    // Real-time listener for branches (academies)
    useEffect(() => {
        const db = getFirestore();
        // Query global 'branches' collection group
        const q = query(
            collectionGroup(db, "branches"),
            // where("isActive", "==", true)
            // orderBy("createdAt", "desc") // May require index
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => {
                const data = doc.data();
                // Extract tenantId from path: tenants/{tenantId}/branches/{branchId}
                const tenantId = doc.ref.parent.parent?.id;

                return {
                    id: doc.id,
                    tenantId,
                    refPath: doc.ref.path,
                    ...data
                };
            });
            setAcademies(list);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching academies:", err);
            // If error is "requires an index", we might need to create it.
            // For now, fail gracefully.
            setError(err);
            setLoading(false);
            addToast({ title: "Erro", message: "Erro ao carregar academias.", color: "danger" });
        });

        return () => unsubscribe();
    }, [addToast]);

    const createAcademy = useCallback(async (data) => {
        setLoading(true);
        try {
            const result = await createAcademyFunction(data);
            addToast({ title: "Sucesso", message: "Academia criada com sucesso!", color: "success" });
            setLoading(false);
            return result.data;
        } catch (err) {
            console.error("Error creating academy:", err);
            addToast({ title: "Erro", message: err.message || "Erro ao criar academia.", color: "danger" });
            setLoading(false);
            throw err;
        }
    }, [addToast, createAcademyFunction]);

    const checkSlugAvailability = useCallback(async (slug) => {
        try {
            const result = await checkSlugFunction({ slug });
            return result.data.available;
        } catch (err) {
            console.error("Error checking slug:", err);
            return false;
        }
    }, [checkSlugFunction]);

    const updateAcademy = useCallback(async (data) => {
        setLoading(true);
        try {
            const result = await updateAcademyFunction(data);
            addToast({ title: "Sucesso", message: "Dados atualizados com sucesso!", color: "success" });
            setLoading(false);
            return result.data;
        } catch (err) {
            console.error("Error updating academy:", err);
            addToast({ title: "Erro", message: err.message || "Erro ao atualizar dados.", color: "danger" });
            setLoading(false);
            throw err;
        }
    }, [addToast, updateAcademyFunction]);

    return {
        academies,
        loading,
        error,
        createAcademy,
        updateAcademy,
        checkSlugAvailability
    };
};

export default useAcademies;
