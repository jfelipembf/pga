
/**
 * Formata um plano de treino para ser enviado via WhatsApp
 */
export const formatTrainingForWhatsApp = (workout) => {
    if (!workout) return "";

    let content = `*${workout.description || "Treino"}* (${workout.totalDistance || 0}m)\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (workout.sections && workout.sections.length > 0) {
        workout.sections.forEach(section => {
            const sectionDistance = (section.items || []).reduce((acc, item) => {
                return acc + (parseInt(item.reps || 0) * parseInt(item.distance || 0));
            }, 0);

            content += ` *${section.name.toUpperCase()}* (${sectionDistance}m)\n`;

            if (section.items && section.items.length > 0) {
                section.items.forEach((item, idx) => {
                    const style = item.style?.label || item.style || "";
                    const material = Array.isArray(item.equipment)
                        ? item.equipment.map(e => e.label || e.value || e).join(", ")
                        : (item.equipment?.label || item.equipment || "");
                    const intensity = item.intensity?.label || item.intensity || "";

                    content += `${idx + 1}. *${item.reps}x${item.distance}m* ${item.exercise || ""}`;
                    if (style) content += ` (${style})`;
                    if (intensity) content += ` - ${intensity}`;
                    if (material) content += ` [${material}]`;
                    if (item.interval) content += ` | Int: ${item.interval}s`;
                    if (item.observation) content += `\n   _Obs: ${item.observation}_`;
                    content += `\n`;
                });
            }
            content += `\n`;
        });
    } else if (workout.items && workout.items.length > 0) {
        // Fallback para legado se necessário
        workout.items.forEach((item, idx) => {
            content += `${idx + 1}. *${item.reps}x${item.distance}m* ${item.exercise || ""}\n`;
        });
    }

    return content.trim();
};
