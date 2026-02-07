/**
 * Formata um treino para envio via WhatsApp utilizando emojis e estrutura organizada.
 */
export const formatTrainingMessage = (training) => {
    if (!training || !training.sections) return "";

    let message = `📋 *${training.name || "Novo Treino"}*\n`;
    if (training.description) message += `📝 ${training.description}\n`;
    if (training.totalDistance) message += `📏 Volume Total: *${training.totalDistance}m*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    training.sections.forEach((section) => {
        message += `🔥 *${section.name.toUpperCase()}*\n`;

        section.items.forEach((item) => {
            // Formato: Exercício - 4x100m @ :15s (Z3)
            let row = `🔹 ${item.exercise || "Exercício"}`;

            if (item.reps || item.distance) {
                row += ` - *${item.reps || "1"}x${item.distance || "0"}m*`;
            }

            if (item.intensity) {
                row += ` (${item.intensity})`;
            }

            if (item.interval) {
                row += ` [Int: ${item.interval}]`;
            }

            if (item.observation) {
                row += `\n   _Note: ${item.observation}_`;
            }

            if (item.equipment && item.equipment.length > 0) {
                row += `\n   ⚙️ ${item.equipment.join(", ")}`;
            }

            message += row + `\n\n`;
        });

        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    });

    return message;
};
