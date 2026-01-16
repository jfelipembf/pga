import axios from "axios";

/**
 * Fetches address data from a given CEP.
 * @param {string} cep - The CEP to search for.
 * @returns {Promise<Object|null>} - The address data or null if not found.
 */
export const fetchAddressByCep = async (cep) => {
    if (!cep) return null;

    // Remove non-digits
    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) return null;

    try {
        const response = await axios.get(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching CEP:", error);
        return null;
    }
};
