const zod = require("zod");

/**
 * Zod Resolution
 * Compatible with Node.js (CommonJS) and Webpack (React Scripts).
 * 
 * Note: We use Zod v3.21.4 to ensure compatibility with CRA which can have issues
 * with .cjs files used in newer Zod versions within monorepo workspaces.
 */
function getZodInstance(mod) {
    if (!mod) throw new Error("Zod module failed to load.");

    // Direct match (if module exports the builder function directly)
    if (typeof mod.string === 'function') return mod;

    // Namespace match
    if (mod.z && typeof mod.z.string === 'function') return mod.z;

    // Default export match
    if (mod.default && typeof mod.default.string === 'function') return mod.default;

    // Fallback
    return mod.z || mod;
}

const z = getZodInstance(zod);

module.exports = { z };
