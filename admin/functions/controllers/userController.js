const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { admin, db } = require("../helpers/firebaseAdmin");
const { filterUserPayload, REQUIRED_CREATE_FIELDS } = require("../constants/userFields");
const { getNextSequenceValue } = require("../helpers/counterHelper");
const authService = require("../services/authService");
const logger = require("firebase-functions/logger");

/**
 * Create a new user (Auth + Firestore).
 */
exports.createUser = onCall(async (request) => {
    const data = request.data;

    // Validate required fields
    for (const field of REQUIRED_CREATE_FIELDS) {
        if (!data[field]) {
            throw new HttpsError("invalid-argument", `Missing required field: ${field}`);
        }
    }

    try {
        // 0. Generate Sequential ID
        const userId = await getNextSequenceValue('userId');

        // 1. Create/Find User in Firebase Auth
        const { uid } = await authService.findOrCreateUser({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            photo: data.photo
        });

        // 2. Prepare Firestore Payload
        const userInfo = filterUserPayload(data);
        const firestorePayload = {
            ...userInfo,
            uid: uid,
            userId: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            status: "active",
        };

        // 3. Save to Firestore
        await db.collection("users").doc(uid).set(firestorePayload);

        // 4. Set Custom Claims
        if (data.role) {
            await authService.setUserClaims(uid, { role: data.role });
        }

        logger.info(`User processed: ${uid} (ID: ${userId})`);
        return { success: true, uid: uid, userId: userId, message: "User created successfully" };

    } catch (error) {
        logger.error("Error creating user:", error);
        throw new HttpsError(
            error.code === "auth/email-already-exists" ? "already-exists" : "internal",
            error.message
        );
    }
});

/**
 * Update an existing user.
 */
exports.updateUser = onCall(async (request) => {
    const data = request.data;
    const uid = data.uid;

    if (!uid) {
        throw new HttpsError("invalid-argument", "The function must be called with a 'uid'.");
    }

    try {
        const updates = filterUserPayload(data);
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        // Update Firestore
        await db.collection("users").doc(uid).update(updates);

        // Update Auth Profile
        await authService.updateAuthProfile(uid, updates);

        // Update Role claim
        if (updates.role) {
            await authService.setUserClaims(uid, { role: updates.role });
        }

        logger.info(`User updated: ${uid}`);
        return { success: true, message: "User updated successfully" };
    } catch (error) {
        logger.error("Error updating user:", error);
        throw new HttpsError("internal", error.message);
    }
});

/**
 * Get a user by UID.
 */
exports.getUser = onCall(async (request) => {
    const uid = request.data.uid;
    if (!uid) throw new HttpsError("invalid-argument", "UID required");

    try {
        const doc = await db.collection("users").doc(uid).get();
        if (!doc.exists) {
            throw new HttpsError("not-found", "User not found");
        }
        return { ...doc.data(), uid: doc.id };
    } catch (error) {
        throw new HttpsError("internal", error.message);
    }
});

/**
 * Soft delete or Hard delete user.
 */
exports.deleteUser = onCall(async (request) => {
    const { uid, hardDelete } = request.data;
    if (!uid) throw new HttpsError("invalid-argument", "UID required");

    try {
        if (hardDelete) {
            await admin.auth().deleteUser(uid);
            await db.collection("users").doc(uid).delete();
            return { success: true, message: "User permanently deleted" };
        } else {
            await db.collection("users").doc(uid).update({
                isActive: false,
                status: "cancelled",
                deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await admin.auth().updateUser(uid, { disabled: true });
            return { success: true, message: "User deactivated" };
        }
    } catch (error) {
        logger.error("Error deleting user:", error);
        throw new HttpsError("internal", error.message);
    }
});
