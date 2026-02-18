export const SPEED_TEMPLATES = [
    {
        id: "speed_sprint_50m",
        name: "⚡ Velocidade 50m (Sprint)",
        category: "main",
        objective: "speed",
        targetDistance: "50m",
        description: "Foco em explosão, técnica de saída e nado em apneia parcial.",
        sections: [
            {
                name: "Aquecimento",
                items: [
                    { reps: 1, distance: 400, exercise: "Crawl progressivo", style: "crawl", intensity: "A1", equipment: [], interval: "30" },
                    { reps: 4, distance: 50, exercise: "Educativo: braço estendido", style: "drills", intensity: "TEC", equipment: ["fins"], interval: "15" },
                ]
            },
            {
                name: "Pré-Principal",
                items: [
                    { reps: 6, distance: 25, exercise: "Progressão 1 a 3", style: "crawl", intensity: "A2", equipment: [], interval: "20", observation: "Terminar forte" },
                ]
            },
            {
                name: "Parte Principal",
                items: [
                    { reps: 8, distance: 25, exercise: "Sprint Máximo", style: "crawl", intensity: "VEL", equipment: [], interval: "60", observation: "Foco em frequência de braçada" },
                    { reps: 4, distance: 50, exercise: "Nado Relaxado", style: "freestyle_choice", intensity: "A0", equipment: [], interval: "30" },
                    { reps: 4, distance: 25, exercise: "Sprint com Paraquedas", style: "crawl", intensity: "VEL", equipment: ["parachute"], interval: "90" },
                ]
            },
            {
                name: "Soltura",
                items: [
                    { reps: 1, distance: 200, exercise: "Livre solto", style: "freestyle_choice", intensity: "A0", equipment: [], interval: "" },
                ]
            }
        ]
    },
    {
        id: "speed_power_100m",
        name: "🚀 Potência 100m",
        category: "main",
        objective: "speed",
        targetDistance: "100m",
        description: "Desenvolvimento de tolerância ao lactato e manutenção de velocidade.",
        sections: [
            {
                name: "Aquecimento",
                items: [
                    { reps: 1, distance: 500, exercise: "Medley solto", style: "medley", intensity: "A1", equipment: [], interval: "30" },
                ]
            },
            {
                name: "Parte Principal",
                items: [
                    { reps: 4, distance: 50, exercise: "Sprint - 95%", style: "crawl", intensity: "AN", equipment: [], interval: "120", observation: "Simulação de segunda metade de prova" },
                    { reps: 1, distance: 100, exercise: "Soltura", style: "freestyle_choice", intensity: "A0", equipment: [], interval: "60" },
                    { reps: 8, distance: 25, exercise: "Perna Máxima", style: "kicking", intensity: "VEL", equipment: ["fins", "board"], interval: "45" },
                ]
            },
            {
                name: "Soltura",
                items: [
                    { reps: 1, distance: 200, exercise: "Costas bem solto", style: "backstroke", intensity: "A0", equipment: [], interval: "" },
                ]
            }
        ]
    }
];
