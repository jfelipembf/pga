const { db } = require("./firebaseAdmin");

/**
 * Generates the next sequential ID for a given counter name.
 * Pads the number with zeros to ensure at least 4 digits (e.g., 0001, 0012, 0123).
 * @param {string} counterName - The name of the counter (e.g., 'userId', 'academiesId').
 * @returns {Promise<string>} - The formatted sequence ID.
 */
exports.getNextSequenceValue = async (counterName) => {
    const counterRef = db.collection("counters").doc(counterName);

    return db.runTransaction(async (transaction) => {
        const doc = await transaction.get(counterRef);
        let nextValue = 1;

        if (doc.exists) {
            nextValue = (doc.data().value || 0) + 1;
        }

        transaction.set(counterRef, { value: nextValue }, { merge: true });

        // Format to string with leading zeros (4 digits)
        return String(nextValue).padStart(4, "0");
    });
};
