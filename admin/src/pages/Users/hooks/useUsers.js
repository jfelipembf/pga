import { useState, useEffect, useCallback } from "react";
import { getFirestore, collection, onSnapshot, query, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useToast } from "../../../components/Common/ToastProvider";

const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToast } = useToast();

    const functions = getFunctions();
    const createUserFunction = httpsCallable(functions, 'createUser');
    const updateUserFunction = httpsCallable(functions, 'updateUser');
    const deleteUserFunction = httpsCallable(functions, 'deleteUser');

    // Real-time listener for users list
    useEffect(() => {
        const db = getFirestore();
        const q = query(
            collection(db, "users"),
            where("isActive", "==", true) // Only fetch active users by default
            // orderBy("createdAt", "desc") // Requires index, adding might cause error if not indexed yet
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(userList);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching users:", err);
            setError(err);
            setLoading(false);
            addToast({ title: "Erro", message: "Erro ao carregar usuários.", color: "danger" });
        });

        return () => unsubscribe();
    }, [addToast]);

    const addUser = useCallback(async (userData) => {
        setLoading(true);
        try {
            // Default password for new users if not provided in UI (or handle in UI)
            // Ideally UI should ask for it or generate one.
            // For now, let's assume specific logic or default.
            const payload = {
                ...userData,
                password: "DefaultPassword123!", // TEMPORARY: In prod, send welcome email or ask in UI
            };

            const result = await createUserFunction(payload);
            addToast({ title: "Sucesso", message: "Usuário criado com sucesso!", color: "success" });
            setLoading(false);
            return result.data;
        } catch (err) {
            console.error("Error creating user:", err);
            addToast({ title: "Erro", message: err.message || "Erro ao criar usuário.", color: "danger" });
            setLoading(false);
            throw err;
        }
    }, [addToast, createUserFunction]);

    const updateUser = useCallback(async (uid, updates) => {
        setLoading(true);
        try {
            await updateUserFunction({ uid, ...updates });
            addToast({ title: "Sucesso", message: "Usuário atualizado com sucesso!", color: "success" });
            setLoading(false);
        } catch (err) {
            console.error("Error updating user:", err);
            addToast({ title: "Erro", message: err.message || "Erro ao atualizar usuário.", color: "danger" });
            setLoading(false);
            throw err;
        }
    }, [addToast, updateUserFunction]);

    const removeUser = useCallback(async (uid) => {
        // confirmation logic should be in UI
        try {
            await deleteUserFunction({ uid, hardDelete: false });
            addToast({ title: "Sucesso", message: "Usuário removido com sucesso!", color: "success" });
        } catch (err) {
            console.error("Error deleting user:", err);
            addToast({ title: "Erro", message: err.message || "Erro ao remover usuário.", color: "danger" });
            throw err;
        }
    }, [addToast, deleteUserFunction]);

    return {
        users,
        loading,
        error,
        addUser,
        updateUser,
        removeUser
    };
};

export default useUsers;
