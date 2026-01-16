/**
 * User Fields Definition
 * Defines the allowed fields for user creation and update.
 */

// Core fields that correspond to the main user profile
const CORE_FIELDS = [
    "firstName",
    "lastName",
    "gender",
    "birthdate",
    "role",
    "email",
    "phone",
    "photo", // URL to the uploaded photo
];

// Address fields (can be nested or flat, here we treat address as an object map if needed, 
// but for simple validation we can allow 'address' object)
const ADDRESS_FIELDS = [
    "address", // Expecting an object: { street, number, complement, neighborhood, city, state, zip }
];

// All allowed fields for writes
const ALLOWED_FIELDS = [...CORE_FIELDS, ...ADDRESS_FIELDS];

/**
 * Filters the input payload to include only allowed fields.
 * @param {Object} data - The input data object.
 * @returns {Object} - A new object with only allowed fields.
 */
exports.filterUserPayload = (data) => {
    const filtered = {};
    ALLOWED_FIELDS.forEach((field) => {
        if (data[field] !== undefined) {
            filtered[field] = data[field];
        }
    });
    return filtered;
};

exports.REQUIRED_CREATE_FIELDS = ["email", "firstName", "lastName", "phone"];
