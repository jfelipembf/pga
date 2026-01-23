const { getPerformanceCategory } = require("./schema");

/**
 * Utility to track execution time of an async function.
 * @param {string} name - The name of the function or operation
 * @param {Function} fn - The function to execute
 * @param {Object} context - Optional context (academyId, userId)
 * @returns {Promise<{result: any, log: Object}>}
 */
const trackPerformance = async (name, fn, context = {}) => {
    const start = Date.now();
    let status = "success";
    let errorMessage = null;
    let result;

    try {
        result = await fn();
    } catch (error) {
        status = "error";
        errorMessage = error.message;
        throw error;
    } finally {
        const end = Date.now();
        const duration = end - start;

        const log = {
            functionName: name,
            duration,
            status,
            category: getPerformanceCategory(duration),
            timestamp: new Date(), // Caller should convert to Firestore Timestamp if needed
            ...context
        };

        if (errorMessage) log.errorMessage = errorMessage;

        // Note: We return the log so the caller can decide how to persist it
        // (e.g. via Firestore or console.log)
        return { result, log };
    }
};

module.exports = {
    trackPerformance,
    getPerformanceCategory
};
