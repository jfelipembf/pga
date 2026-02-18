import { ALL_TEMPLATES } from "./templates";

// ─── ESTILOS DE NADO ────────────────────────────────────────────────
export const SWIMMING_STYLES = [
    { value: "crawl", label: "Crawl" },
    { value: "backstroke", label: "Costas" },
    { value: "breaststroke", label: "Peito" },
    { value: "butterfly", label: "Borboleta" },
    { value: "medley", label: "Medley" },
    { value: "drills", label: "Educativo" },
    { value: "kicking", label: "Perna" },
    { value: "pulling", label: "Braço" },
    { value: "freestyle_choice", label: "Livre/Escolha" },
];

// ─── ZONAS DE INTENSIDADE (Expandidas) ──────────────────────────────
export const INTENSITIES = [
    { value: "A0", label: "A0 – Recuperação", color: "#90CAF9", fcRange: "< 60%", lactate: "< 1.5", description: "Soltura e recuperação ativa" },
    { value: "A1", label: "A1 – Aeróbio Leve", color: "#66BB6A", fcRange: "60-70%", lactate: "1.5-2.5", description: "Aquecimento e base aeróbia leve" },
    { value: "A2", label: "A2 – Aeróbio Moderado", color: "#FFA726", fcRange: "70-80%", lactate: "2.5-4.0", description: "Resistência aeróbia, base de volume" },
    { value: "A3", label: "A3 – Limiar", color: "#EF5350", fcRange: "80-85%", lactate: "4.0-6.0", description: "Limiar anaeróbio, resistência forte" },
    { value: "VO2", label: "VO2 – Potência Aeróbia", color: "#AB47BC", fcRange: "85-95%", lactate: "6.0-10", description: "VO2 máximo, séries intensas" },
    { value: "AN", label: "AN – Anaeróbio", color: "#F44336", fcRange: "> 90%", lactate: "> 10", description: "Sprint anaeróbio, tolerância ao lactato" },
    { value: "VEL", label: "VEL – Velocidade", color: "#E91E63", fcRange: "Máxima", lactate: "-", description: "Velocidade máxima, reação, saída" },
    { value: "TEC", label: "TEC – Técnica", color: "#26A69A", fcRange: "Variável", lactate: "-", description: "Foco em correção técnica e educativos" },
];

// ─── EQUIPAMENTOS ───────────────────────────────────────────────────
export const EQUIPMENT = [
    { value: "fins", label: "Pé de Pato" },
    { value: "paddles", label: "Palmar" },
    { value: "pullbuoy", label: "Pull Buoy" },
    { value: "snorkel", label: "Snorkel" },
    { value: "board", label: "Prancha" },
    { value: "band", label: "Elástico" },
    { value: "parachute", label: "Paraquedas" },
    { value: "tennis_ball", label: "Bola de Tênis" },
    { value: "finger_paddles", label: "Palmar de Dedo" },
];

// ─── DISTÂNCIAS ─────────────────────────────────────────────────────
// Distâncias padrão (para piscinas de 25m)
export const DISTANCE_OPTIONS = [
    15, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1500, 2000
];

/**
 * Gera opções de distância baseadas no comprimento da piscina
 * Ex: piscina de 18m → [18, 36, 54, 72, 90, 108, 126, 144, 162, 180, 360, 540, 720, 900]
 * Ex: piscina de 25m → [25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 800, 1000, 1500]
 */
export const generateDistanceOptions = (poolLength) => {
    if (!poolLength || poolLength <= 0) return DISTANCE_OPTIONS;

    const pl = Math.round(poolLength);
    const options = new Set();

    // Múltiplos diretos: 1x até 10x
    for (let i = 1; i <= 10; i++) {
        options.add(pl * i);
    }

    // Múltiplos maiores: 15x, 20x, 25x, 30x, 40x, 50x
    [15, 20, 25, 30, 40, 50, 60, 75, 100].forEach(mult => {
        const val = pl * mult;
        if (val <= 3000) options.add(val);
    });

    return Array.from(options).sort((a, b) => a - b);
};

// ─── DURAÇÕES DE SESSÃO PRÉ-DEFINIDAS ───────────────────────────────
export const SESSION_DURATIONS = [
    { value: 30, label: "30 min" },
    { value: 45, label: "45 min" },
    { value: 50, label: "50 min" },
    { value: 60, label: "1 hora" },
    { value: 75, label: "1h15" },
    { value: 90, label: "1h30" },
    { value: 120, label: "2 horas" },
];

// ─── MODALIDADES / CATEGORIAS ───────────────────────────────────────
export const MODALITIES = [
    { value: "learn", label: "Aprendizado", maxVolume: 1500, ageRange: "4-7 anos", color: "#81C784" },
    { value: "improve", label: "Aperfeiçoamento", maxVolume: 3000, ageRange: "7-12 anos", color: "#4FC3F7" },
    { value: "competitive", label: "Competitivo", maxVolume: 8000, ageRange: "12+ anos", color: "#FF7043" },
    { value: "masters", label: "Masters", maxVolume: 5000, ageRange: "25+ anos", color: "#AB47BC" },
    { value: "triathlon", label: "Triathlon", maxVolume: 5000, ageRange: "Adulto", color: "#26A69A" },
    { value: "aqua_fitness", label: "Hidroginástica", maxVolume: 1500, ageRange: "Adulto", color: "#78909C" },
];

// ─── FASES DO MACROCICLO ────────────────────────────────────────────
export const TRAINING_PHASES = [
    { value: "general_prep", label: "Preparatório Geral", icon: "mdi-weight-lifter", description: "Foco em volume alto e intensidade baixa", volumeMultiplier: 1.0 },
    { value: "specific_prep", label: "Preparatório Específico", icon: "mdi-target", description: "Volume moderado, intensidade crescente", volumeMultiplier: 0.9 },
    { value: "pre_competitive", label: "Pré-Competitivo", icon: "mdi-flash", description: "Volume reduzindo, intensidade alta", volumeMultiplier: 0.75 },
    { value: "competitive", label: "Competitivo", icon: "mdi-trophy", description: "Volume baixo (taper), picos de velocidade", volumeMultiplier: 0.5 },
    { value: "transition", label: "Transição/Descanso", icon: "mdi-sleep", description: "Recuperação ativa, volume mínimo", volumeMultiplier: 0.4 },
];

// ─── OBJETIVOS DO TREINO ────────────────────────────────────────────
export const TRAINING_OBJECTIVES = [
    { value: "aerobic_base", label: "Resistência Aeróbia", icon: "mdi-heart-pulse", zones: ["A1", "A2"] },
    { value: "anaerobic_threshold", label: "Limiar Anaeróbio", icon: "mdi-speedometer", zones: ["A2", "A3"] },
    { value: "vo2max", label: "VO2 Máximo", icon: "mdi-fire", zones: ["VO2"] },
    { value: "speed", label: "Velocidade", icon: "mdi-lightning-bolt", zones: ["AN", "VEL"] },
    { value: "technique", label: "Técnica / Educativo", icon: "mdi-school", zones: ["TEC", "A0", "A1"] },
    { value: "race_pace", label: "Ritmo de Prova", icon: "mdi-timer", zones: ["A3", "VO2", "AN"] },
    { value: "starts_turns", label: "Saídas e Viradas", icon: "mdi-rotate-right", zones: ["VEL"] },
    { value: "mixed", label: "Misto / Completo", icon: "mdi-shuffle-variant", zones: ["A1", "A2", "A3"] },
];

// ─── DISTÂNCIA ALVO DA PROVA ────────────────────────────────────────
export const TARGET_DISTANCES = [
    { value: "50m", label: "50m (Sprint)", weeklyVolume: "15-20 km", zoneProfile: { A1: 30, A2: 25, A3: 15, VO2: 10, AN: 10, VEL: 10 } },
    { value: "100m", label: "100m (Velocidade)", weeklyVolume: "20-25 km", zoneProfile: { A1: 30, A2: 25, A3: 15, VO2: 10, AN: 10, VEL: 10 } },
    { value: "200m", label: "200m (Meio-Fundo)", weeklyVolume: "25-35 km", zoneProfile: { A1: 25, A2: 30, A3: 20, VO2: 15, AN: 5, VEL: 5 } },
    { value: "400m", label: "400m (Meio-Fundo)", weeklyVolume: "30-40 km", zoneProfile: { A1: 25, A2: 35, A3: 25, VO2: 10, AN: 3, VEL: 2 } },
    { value: "800m", label: "800m (Fundo)", weeklyVolume: "35-50 km", zoneProfile: { A1: 20, A2: 40, A3: 25, VO2: 10, AN: 3, VEL: 2 } },
    { value: "1500m", label: "1500m (Fundo)", weeklyVolume: "40-60 km", zoneProfile: { A1: 20, A2: 40, A3: 30, VO2: 8, AN: 1, VEL: 1 } },
    { value: "general", label: "Geral / Sem prova", weeklyVolume: "Variável", zoneProfile: { A1: 30, A2: 35, A3: 20, VO2: 8, AN: 4, VEL: 3 } },
];

// ─── TEMPLATES DE TREINO PRÉ-MONTADOS ───────────────────────────────
export const TRAINING_TEMPLATES = ALL_TEMPLATES;

// ─── PACE ESTIMADO POR ZONA (seg/100m) ──────────────────────────────
// Usado para calcular duração estimada do treino
export const ESTIMATED_PACE = {
    A0: 150,  // 2:30/100m
    A1: 120,  // 2:00/100m
    A2: 105,  // 1:45/100m
    A3: 90,   // 1:30/100m
    VO2: 80,   // 1:20/100m
    AN: 70,   // 1:10/100m
    VEL: 60,   // 1:00/100m
    TEC: 130,  // 2:10/100m
};

// ─── TEMPLATE CATEGORIES ────────────────────────────────────────────
export const TEMPLATE_CATEGORIES = [
    { value: "warmup", label: "Aquecimento", icon: "mdi-fire", color: "#FFA726" },
    { value: "main", label: "Treino Completo", icon: "mdi-swim", color: "#42A5F5" },
    { value: "cooldown", label: "Soltura", icon: "mdi-snowflake", color: "#90CAF9" },
];
