const admin = require("firebase-admin");
const functions = require("firebase-functions/v1");

/**
 * Get or create Firebase Auth user by email
 */
exports.getOrCreateAuthUser = async ({ email, password, displayName, disabled = false }) => {
    let userRecord = null;

    try {
        userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
        if (error.code !== "auth/user-not-found") {
            throw error;
        }
    }

    if (!userRecord) {
        userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
            disabled,
        });
    }

    return userRecord;
};

/**
 * Update Firebase Auth user with error handling
 */
exports.updateAuthUser = async (uid, updates) => {
    try {
        await admin.auth().updateUser(uid, updates);
    } catch (authError) {
        if (authError.code === "auth/user-not-found") {
            throw new functions.https.HttpsError(
                "not-found",
                "Usuário não encontrado no Auth."
            );
        }
        if (authError.code === "auth/email-already-exists") {
            throw new functions.https.HttpsError(
                "already-exists",
                "O email fornecido já está em uso por outro usuário."
            );
        }
        if (authError.code === "auth/invalid-password") {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "A senha deve ter pelo menos 6 caracteres."
            );
        }
        throw authError;
    }
};

/**
 * Build auth update object from staff data
 */
exports.buildAuthUpdates = (data, currentData) => {
    const updates = {};

    if (data.email !== undefined && data.email !== currentData?.email) {
        updates.email = data.email;
    }

    if (data.password && data.password.length >= 6) {
        updates.password = data.password;
    }

    if (data.displayName && data.displayName !== currentData?.displayName) {
        updates.displayName = data.displayName;
    }

    if (data.status !== undefined) {
        updates.disabled = data.status === "inactive";
    }

    if (data.photo !== null && data.photo !== undefined) {
        updates.photoURL = data.photo;
    }

    return updates;
};
