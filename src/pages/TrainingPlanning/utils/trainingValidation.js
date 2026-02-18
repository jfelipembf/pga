import { INTENSITIES, MODALITIES, ESTIMATED_PACE } from '../constants/trainingConstants';

/**
 * Validação inteligente de treinos - Alertas profissionais
 * 
 * Retorna um array de alertas { type: 'warning' | 'error' | 'info', message: string }
 */

/**
 * Valida o treino completo com base no contexto (modalidade, fase, objetivo)
 */
export const validateTraining = (sections, context = {}) => {
    const alerts = [];
    const { modality, phase, objective, targetDistance } = context;

    // Cálculos globais
    const allItems = sections.flatMap(s => s.items || []);
    const totalDistance = allItems.reduce((acc, item) => {
        return acc + ((parseInt(item.reps) || 0) * (parseInt(item.distance) || 0));
    }, 0);

    const zoneDistribution = calculateZoneDistribution(allItems);

    // ─── VALIDAÇÃO 1: Volume vs Modalidade ─────────────────────
    if (modality) {
        const mod = MODALITIES.find(m => m.value === modality);
        if (mod && totalDistance > mod.maxVolume) {
            alerts.push({
                type: 'warning',
                icon: 'mdi-alert',
                message: `Volume total (${totalDistance}m) excede o recomendado para ${mod.label} (máx ${mod.maxVolume}m)`
            });
        }
        if (mod && totalDistance < 200 && allItems.length > 0) {
            alerts.push({
                type: 'info',
                icon: 'mdi-information',
                message: `Volume muito baixo (${totalDistance}m). Considere se o treino está completo.`
            });
        }
    }

    // ─── VALIDAÇÃO 2: Velocidade com distância longa ────────────
    const speedItems = allItems.filter(item => {
        const zone = item.intensity?.value || item.intensity;
        return zone === 'AN' || zone === 'VEL';
    });
    const longSpeedItems = speedItems.filter(item => (parseInt(item.distance) || 0) > 100);
    if (longSpeedItems.length > 0) {
        alerts.push({
            type: 'warning',
            icon: 'mdi-speedometer',
            message: `${longSpeedItems.length} série(s) de velocidade/anaeróbio com distância > 100m. Séries de sprint geralmente são ≤ 100m.`
        });
    }

    // ─── VALIDAÇÃO 3: Séries AN com distância > 200m ────────────
    const anItems = allItems.filter(item => {
        const zone = item.intensity?.value || item.intensity;
        return zone === 'AN';
    });
    const longAnItems = anItems.filter(item => (parseInt(item.distance) || 0) > 200);
    if (longAnItems.length > 0) {
        alerts.push({
            type: 'error',
            icon: 'mdi-alert-circle',
            message: `Séries anaeróbias com distância > 200m não são fisiologicamente sustentáveis. Considere zonas A3 ou VO2.`
        });
    }

    // ─── VALIDAÇÃO 4: Treino sem aquecimento ────────────────────
    const hasWarmup = sections.some(s => {
        const name = (s.name || '').toLowerCase();
        return name.includes('aquec') || name.includes('warmup') || name.includes('warm');
    });
    if (!hasWarmup && sections.length > 0 && totalDistance > 500) {
        alerts.push({
            type: 'warning',
            icon: 'mdi-fire',
            message: `Treino sem seção de aquecimento identificada. Recomenda-se iniciar com aquecimento progressivo.`
        });
    }

    // ─── VALIDAÇÃO 5: Treino sem soltura ────────────────────────
    const hasCooldown = sections.some(s => {
        const name = (s.name || '').toLowerCase();
        return name.includes('solt') || name.includes('cool') || name.includes('volta') || name.includes('recup');
    });
    if (!hasCooldown && sections.length > 0 && totalDistance > 500) {
        alerts.push({
            type: 'info',
            icon: 'mdi-snowflake',
            message: `Considere adicionar uma seção de soltura/recuperação ao final do treino.`
        });
    }

    // ─── VALIDAÇÃO 6: Proporção de zonas desequilibrada ─────────
    const highIntensityPct = (zoneDistribution.A3 || 0) + (zoneDistribution.VO2 || 0) + (zoneDistribution.AN || 0) + (zoneDistribution.VEL || 0);
    if (highIntensityPct > 60 && totalDistance > 1000) {
        alerts.push({
            type: 'warning',
            icon: 'mdi-chart-pie',
            message: `Mais de 60% do treino em intensidade alta (${highIntensityPct.toFixed(0)}%). Isso pode causar fadiga excessiva.`
        });
    }

    // ─── VALIDAÇÃO 7: Intervalo insuficiente para AN/VEL ────────
    const fastItemsNoInterval = speedItems.filter(item => {
        const interval = parseInt(item.interval) || 0;
        return interval > 0 && interval < 30;
    });
    if (fastItemsNoInterval.length > 0) {
        alerts.push({
            type: 'info',
            icon: 'mdi-timer-sand',
            message: `Séries de velocidade com intervalo < 30s. Para sprints puros, intervalos de 45-120s são mais eficazes.`
        });
    }

    return alerts;
};

/**
 * Calcula a distribuição percentual por zona de intensidade
 */
export const calculateZoneDistribution = (items) => {
    if (!items || items.length === 0) return {};

    const zoneMeters = {};
    let totalMeters = 0;

    items.forEach(item => {
        const zone = item.intensity?.value || item.intensity || 'A1';
        const meters = (parseInt(item.reps) || 0) * (parseInt(item.distance) || 0);
        zoneMeters[zone] = (zoneMeters[zone] || 0) + meters;
        totalMeters += meters;
    });

    if (totalMeters === 0) return {};

    const distribution = {};
    Object.entries(zoneMeters).forEach(([zone, meters]) => {
        distribution[zone] = (meters / totalMeters) * 100;
    });

    return distribution;
};

/**
 * Calcula a metragem absoluta por zona (para o gráfico)
 */
export const calculateZoneMeters = (items) => {
    if (!items || items.length === 0) return {};

    const zoneMeters = {};

    items.forEach(item => {
        const zone = item.intensity?.value || item.intensity || 'A1';
        const meters = (parseInt(item.reps) || 0) * (parseInt(item.distance) || 0);
        zoneMeters[zone] = (zoneMeters[zone] || 0) + meters;
    });

    return zoneMeters;
};

/**
 * Calcula o tempo estimado do treino em minutos
 */
export const calculateEstimatedDuration = (sections) => {
    if (!sections || sections.length === 0) return 0;

    let totalSeconds = 0;

    sections.forEach(section => {
        (section.items || []).forEach(item => {
            const zone = item.intensity?.value || item.intensity || 'A1';
            const pace = ESTIMATED_PACE[zone] || 120; // default 2:00/100m
            const reps = parseInt(item.reps) || 0;
            const distance = parseInt(item.distance) || 0;
            const interval = parseInt(item.interval) || 0;

            // Tempo nadando
            const swimTime = (distance / 100) * pace * reps;
            // Tempo de intervalo entre reps (n-1 intervalos)
            const restTime = reps > 1 ? (reps - 1) * interval : 0;
            // Transição entre séries (~15 seg)
            const transitionTime = 15;

            totalSeconds += swimTime + restTime + transitionTime;
        });
    });

    return Math.round(totalSeconds / 60);
};
