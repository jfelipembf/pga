/**
 * Calculates the total distance of a workout based on its items.
 * @param {Array} items - List of workout items with reps and distance.
 * @returns {number} Total distance in meters.
 */
export const calculateTotalDistance = (items) => {
    if (!items || !Array.isArray(items)) return 0;

    return items.reduce((acc, item) => {
        const reps = parseInt(item.reps) || 0;
        const distance = parseInt(item.distance) || 0;
        return acc + (reps * distance);
    }, 0);
};

/**
 * Calculates total distance from sections (supports nested structure)
 * @param {Array} sections - Array of sections with items
 * @returns {number} Total distance in meters
 */
export const calculateTotalDistanceFromSections = (sections) => {
    if (!sections || !Array.isArray(sections)) return 0;

    return sections.reduce((acc, section) => {
        const sectionTotal = calculateTotalDistance(section.items || []);
        return acc + sectionTotal;
    }, 0);
};

/**
 * Formats duration in minutes to HH:mm string.
 * @param {number} minutes 
 * @returns {string} Formatted duration.
 */
export const formatDuration = (minutes) => {
    if (!minutes) return "00:00";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
