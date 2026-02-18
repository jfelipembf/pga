
import { MODALITIES, TRAINING_PHASES, TRAINING_OBJECTIVES, TARGET_DISTANCES } from '../constants/trainingConstants';
import { calculateEstimatedDuration } from './trainingValidation';

/**
 * Formata um plano de treino para ser enviado via WhatsApp
 */
export const formatTrainingForWhatsApp = (workout) => {
    if (!workout) return "";

    let content = `*${workout.description || "Treino"}* (${workout.totalDistance || 0}m)\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━\n`;

    // Piscina e duração
    if (workout.poolName) {
        content += `🏊 Piscina: ${workout.poolName}`;
        if (workout.poolLength) content += ` (${workout.poolLength}m)`;
        content += `\n`;
    }
    if (workout.sessionDuration) {
        content += `⏱ Duração da aula: ${workout.sessionDuration} min\n`;
    }

    // Contexto do treino
    const contextParts = [];
    if (workout.modality) {
        const mod = MODALITIES.find(m => m.value === workout.modality);
        if (mod) contextParts.push(`📋 ${mod.label}`);
    }
    if (workout.phase) {
        const ph = TRAINING_PHASES.find(p => p.value === workout.phase);
        if (ph) contextParts.push(`📅 ${ph.label}`);
    }
    if (workout.objective) {
        const obj = TRAINING_OBJECTIVES.find(o => o.value === workout.objective);
        if (obj) contextParts.push(`🎯 ${obj.label}`);
    }
    if (workout.targetDistance) {
        const td = TARGET_DISTANCES.find(d => d.value === workout.targetDistance);
        if (td) contextParts.push(`🏊 ${td.label}`);
    }

    if (contextParts.length > 0) {
        content += contextParts.join(' • ') + '\n';
    }

    // Duração estimada
    if (workout.sections && workout.sections.length > 0) {
        const duration = calculateEstimatedDuration(workout.sections);
        if (duration > 0) {
            content += `⏱ Duração estimada: ~${duration} min\n`;
        }
    }

    content += `\n`;

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
        // Fallback para legado
        workout.items.forEach((item, idx) => {
            content += `${idx + 1}. *${item.reps}x${item.distance}m* ${item.exercise || ""}\n`;
        });
    }

    content += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    content += `🏅 _Bom Treino!_`;

    return content.trim();
};
