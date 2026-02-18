export const ENDURANCE_TEMPLATES = [
    {
        id: "endurance_aerobic_base",
        name: "🌊 Base Aeróbia (Volume)",
        category: "main",
        objective: "aerobic_base",
        targetDistance: "1500m",
        description: "Foco em condicionamento cardiovascular e eficiência de nado contínuo.",
        sections: [
            {
                name: "Aquecimento",
                items: [
                    { reps: 1, distance: 400, exercise: "Crawl A1", style: "crawl", intensity: "A1", equipment: [], interval: "" },
                    { reps: 4, distance: 100, exercise: "25 Perna / 75 Nado", style: "crawl", intensity: "A1", equipment: ["fins"], interval: "15" },
                ]
            },
            {
                name: "Parte Principal",
                items: [
                    { reps: 2, distance: 800, exercise: "Crawl constante", style: "crawl", intensity: "A2", equipment: ["snorkel"], interval: "60", observation: "Manter braçada longa" },
                    { reps: 4, distance: 200, exercise: "Crawl com Palmar", style: "crawl", intensity: "A2", equipment: ["paddles", "pullbuoy"], interval: "30" },
                ]
            },
            {
                name: "Soltura",
                items: [
                    { reps: 1, distance: 300, exercise: "Livre solto", style: "freestyle_choice", intensity: "A0", equipment: [], interval: "" },
                ]
            }
        ]
    },
    {
        id: "endurance_threshold_a3",
        name: "🔴 Limiar (Fundo)",
        category: "main",
        objective: "anaerobic_threshold",
        targetDistance: "400m",
        description: "Treino para elevar o limiar anaeróbio, séries longas em ritmo forte.",
        sections: [
            {
                name: "Aquecimento",
                items: [
                    { reps: 1, distance: 400, exercise: "Medley progressivo", style: "medley", intensity: "A1", equipment: [], interval: "30" },
                ]
            },
            {
                name: "Parte Principal",
                items: [
                    { reps: 5, distance: 400, exercise: "Ritmo de Prova A3", style: "crawl", intensity: "A3", equipment: [], interval: "45", observation: "Controle de tempo a cada 100m" },
                ]
            },
            {
                name: "Soltura",
                items: [
                    { reps: 1, distance: 200, exercise: "Soltura total", style: "freestyle_choice", intensity: "A0", equipment: [], interval: "" },
                ]
            }
        ]
    }
];
