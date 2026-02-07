import { getFirebaseBackend } from "../../helpers/firebase_helper";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";
import { normalizeDate } from "../../utils/date";

/**
 * Service for managing Training Plans with Calendar-based organization
 */

const getDb = () => {
    const backend = getFirebaseBackend();
    if (!backend || !backend.db) {
        throw new Error("Firebase Backend não inicializado");
    }
    return backend.db;
};

/**
 * List all training plans for a given date
 * @param {string} dateString - Date in format "YYYY-MM-DD"
 * @returns {Promise<Array>} Array of training plans
 */
export const listTrainingPlans = async (dateString) => {
    try {
        const db = getDb();
        const collectionRef = collection(db, "trainingPlans");
        const q = query(
            collectionRef,
            where("dateString", "==", dateString),
            where("deletedAt", "==", null),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const plans = [];
        snapshot.forEach((doc) => {
            plans.push({ id: doc.id, ...doc.data() });
        });

        return plans;
    } catch (error) {
        console.error("[trainingPlanning.service] Error listing training plans:", error);
        throw error;
    }
};

/**
 * Create a new training plan
 * @param {Object} trainingPlanData - Training plan data
 * @returns {Promise<string>} Created document ID
 */
export const createTrainingPlan = async (trainingPlanData) => {
    try {
        const db = getDb();
        const collectionRef = collection(db, "trainingPlans");

        const payload = {
            ...trainingPlanData,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date()),
            deletedAt: null,
        };

        const docRef = await addDoc(collectionRef, payload);
        return docRef.id;
    } catch (error) {
        console.error("[trainingPlanning.service] Error creating training plan:", error);
        throw error;
    }
};

/**
 * Update an existing training plan
 * @param {string} planId - Training plan ID
 * @param {Object} updatedData - Updated training plan data
 * @returns {Promise<void>}
 */
export const updateTrainingPlan = async (planId, updatedData) => {
    try {
        const db = getDb();
        const docRef = doc(db, "trainingPlans", planId);

        const payload = {
            ...updatedData,
            updatedAt: normalizeDate(new Date()),
        };

        delete payload.id;
        delete payload.createdAt;

        await updateDoc(docRef, payload);
    } catch (error) {
        console.error("[trainingPlanning.service] Error updating training plan:", error);
        throw error;
    }
};

/**
 * Soft delete a training plan
 * @param {string} planId - Training plan ID
 * @returns {Promise<void>}
 */
export const deleteTrainingPlan = async (planId) => {
    try {
        const db = getDb();
        const docRef = doc(db, "trainingPlans", planId);

        await updateDoc(docRef, {
            deletedAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date()),
        });
    } catch (error) {
        console.error("[trainingPlanning.service] Error deleting training plan:", error);
        throw error;
    }
};

/**
 * Permanently delete a training plan
 * @param {string} planId - Training plan ID
 * @returns {Promise<void>}
 */
export const hardDeleteTrainingPlan = async (planId) => {
    try {
        const db = getDb();
        const docRef = doc(db, "trainingPlans", planId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("[trainingPlanning.service] Error hard deleting training plan:", error);
        throw error;
    }
};
