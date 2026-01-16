/**
 * Formata uma string para Title Case (primeira letra maiúscula, demais minúsculas).
 * Mantém exceções comuns em português (de, da, do, dos, das, e) em minúsculo.
 * 
 * @param {string} str String a ser formatada
 * @returns {string} String formatada ou string vazia se nula/indefinida
 */
export const formatTitleCase = (str) => {
    if (!str) return "";

    const exceptions = ["de", "da", "do", "dos", "das", "e"];

    return str.toLowerCase().split(" ").map((word, index) => {
        if (exceptions.includes(word) && index !== 0) {
            return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
};
