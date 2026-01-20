/**
 * Standardized Data Snapshots for Logging and Denormalization
 * 
 * Ensures consistent data structure when storing references to entities (Actors/Targets)
 * in Audit Logs, Notifications, and other denormalized fields.
 */

/**
 * Creates a standard snapshot of the "Actor" (User performing the action).
 * 
 * @param {Object} authContext - The `context.auth` object from Cloud Functions.
 * @param {Object} [userDoc] - Optional full user document from Firestore (if available/needed).
 * @returns {{ uid: string, name: string, email: string, role: string }}
 */
exports.getActorSnapshot = (authContext, userDoc = null) => {
    if (!authContext) {
        return {
            uid: "system",
            name: "Sistema",
            email: "system@app",
            role: "system"
        };
    }

    // Default to Auth Token data (fastest, no DB read required)
    const snapshot = {
        uid: authContext.uid,
        name: authContext.token.name || authContext.token.email || "Usuário",
        email: authContext.token.email || "no-email",
        role: "user" // Default, can be enriched if claims exist
    };

    // If User Doc is provided, enrich with detailed data
    if (userDoc) {
        snapshot.name = userDoc.displayName || userDoc.name || snapshot.name;
        snapshot.role = userDoc.role || snapshot.role;
        snapshot.email = userDoc.email || snapshot.email;
    }

    return snapshot;
};

/**
 * Creates a standard snapshot of the "Target" (Entity being affected).
 * 
 * @param {string} type - Entity type (e.g., 'client', 'staff', 'class').
 * @param {Object} data - The entity data object involved in the operation.
 * @param {string} [id] - The entity ID.
 * @returns {{ type: string, id: string, name: string, [key: string]: any }}
 */
exports.getTargetSnapshot = (type, data, id) => {
    const snapshot = {
        type,
        id: id || data.id,
        name: data.name || data.displayName || data.title || "Sem Nome"
    };

    // Add specific fields based on type if needed
    if (type === 'staff') {
        snapshot.email = data.email;
        snapshot.role = data.role;
    } else if (type === 'client') {
        snapshot.email = data.email;
        snapshot.idGym = data.idGym;
    }

    return snapshot;
};
