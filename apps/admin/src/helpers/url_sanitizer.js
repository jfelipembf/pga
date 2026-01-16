/**
 * Sanitizes a string to be used as a URL slug.
 * Removes accents, special characters, and replaces spaces with hyphens.
 */
export const slugify = (text) => {
    if (!text) return "";

    return text
        .toString()
        .normalize('NFD')                   // split accented characters into their base characters and diacritical marks
        .replace(/[\u0300-\u036f]/g, '')    // remove all the accents
        .toLowerCase()                      // convert to lowercase
        .replace(/\s+/g, '-')               // replace spaces with hyphens
        .replace(/[^a-z0-9/-]/g, '')        // remove anything that is not a letter, number, slash or hyphen
        .replace(/-+/g, '-')                // replace multiple hyphens with a single hyphen
        .replace(/\/+/g, '/')               // replace multiple slashes with a single slash
        .trim()                             // trim leading or trailing whitespace
        .replace(/^-+|-+$/g, '')            // remove leading/trailing hyphens
        .replace(/^\/+|\/+$/g, '');         // remove leading/trailing slashes
};
