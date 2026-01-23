const { z } = require("zod");

const PerformanceLogSchema = z.object({
    functionName: z.string(),
    duration: z.number(), // in milliseconds
    status: z.enum(["success", "error"]),
    category: z.enum(["good", "average", "slow"]), // < 800ms, 800-2000ms, > 2000ms
    timestamp: z.any(), // Firestore Timestamp
    academyId: z.string().optional(),
    userId: z.string().optional(),
    errorMessage: z.string().optional(),
});

const getPerformanceCategory = (duration) => {
    if (duration < 800) return "good";
    if (duration < 2000) return "average";
    return "slow";
};

module.exports = {
    PerformanceLogSchema,
    getPerformanceCategory
};
