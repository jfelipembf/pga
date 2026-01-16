const { auth } = require("../helpers/firebaseAdmin");
const logger = require("firebase-functions/logger");

const DEFAULT_PASSWORD = "123456";

/**
 * Finds a user by email or creates a new one.
 * @param {Object} userData - { email, firstName, lastName, phone, photo }
 * @returns {Promise<Object>} - { uid, isNewUser }
 */
const findOrCreateUser = async (userData) => {
    const { email, firstName, lastName, phone, photo } = userData;

    try {
        const userRecord = await auth.getUserByEmail(email);
        return { uid: userRecord.uid, isNewUser: false };
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            const userRecord = await auth.createUser({
                email,
                password: DEFAULT_PASSWORD,
                displayName: `${firstName} ${lastName}`,
                phoneNumber: phone || undefined,
                photoURL: photo || undefined,
            });
            logger.info(`Auth user created: ${userRecord.uid}`);
            return { uid: userRecord.uid, isNewUser: true, password: DEFAULT_PASSWORD };
        }
        throw error;
    }
};

/**
 * Sets or updates custom claims for a user.
 * @param {string} uid 
 * @param {Object} claims 
 */
const setUserClaims = async (uid, claims) => {
    const currentClaims = (await auth.getUser(uid)).customClaims || {};
    await auth.setCustomUserClaims(uid, { ...currentClaims, ...claims });
};

/**
 * Updates auth profile.
 */
const updateAuthProfile = async (uid, updates) => {
    const authUpdates = {};
    if (updates.firstName && updates.lastName) {
        authUpdates.displayName = `${updates.firstName} ${updates.lastName}`;
    }
    if (updates.photo) {
        authUpdates.photoURL = updates.photo;
    }
    if (updates.phone) {
        authUpdates.phoneNumber = updates.phone;
    }

    if (Object.keys(authUpdates).length > 0) {
        await auth.updateUser(uid, authUpdates);
    }
};

module.exports = {
    findOrCreateUser,
    setUserClaims,
    updateAuthProfile,
    DEFAULT_PASSWORD
};
