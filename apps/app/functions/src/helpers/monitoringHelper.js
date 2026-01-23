const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

// Force Emulator if running locally
if (process.env.FUNCTIONS_EMULATOR === "true") {
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
    admin.firestore().settings({
        host: "localhost:8080",
        ssl: false
    });
}

/**
 * Categorize performance based on duration
 */
const getPerformanceCategory = (duration) => {
    if (duration < 800) return "good";
    if (duration < 2000) return "average";
    return "slow";
};

/**
 * Wrapper for Cloud Functions to automatically track and log performance to Firestore.
 */
const withMonitoring = (functionName, handler) => {
    return async (data, context) => {
        const start = Date.now();
        let status = "success";
        let errorMessage = null;
        let result;

        // Extract context info
        const academyId = data?.academyId || data?.params?.academyId;
        const userId = context?.auth?.uid;

        try {
            result = await handler(data, context);
            return result;
        } catch (error) {
            status = "error";
            errorMessage = error.message;
            throw error;
        } finally {
            const duration = Date.now() - start;

            // Extract performance details from result if available
            const metadata = result && result._perf ? { _perf: result._perf } : {};

            // Save to Firestore background (don't await to avoid adding latency to response)
            admin.firestore().collection("_monitoring_performance").add({
                functionName,
                duration,
                status,
                category: getPerformanceCategory(duration),
                timestamp: FieldValue.serverTimestamp(),
                academyId: academyId || null,
                userId: userId || null,
                errorMessage,
                metadata // Include detailed performance metrics
            }).catch(err => console.error("Monitor Error:", err));
        }
    };
};

module.exports = {
    withMonitoring
};
