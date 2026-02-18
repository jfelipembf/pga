export const OPEN_WATER_TEMPLATES = [
    {
        id: "open_water_triathlon",
        name: "🏊 Mar Aberto / Triathlon",
        category: "main",
        objective: "triathlon",
        targetDistance: "1500m",
        description: "Treino focado em ritmo constante, navegação e braçada de força.",
        sections: [
            {
                name: "Aquecimento",
                items: [
                    { reps: 1, distance: 400, exercise: "Livre solto com navegação", style: "crawl", intensity: "A1", equipment: [], interval: "30", observation: "Olhar para frente a cada 4 braçadas" },
                    { reps: 4, distance: 100, exercise: "Braço progressivo", style: "pulling", intensity: "A2", equipment: ["paddles", "pullbuoy"], interval: "20" },
                ]
            },
            {
                name: "Parte Principal (Ritmo Prova)",
                items: [
                    { reps: 3, distance: 500, exercise: "Crawl ritmo constante", style: "crawl", intensity: "A3", equipment: [], interval: "60", observation: "Simulação de contorno de boia" },
                    { reps: 10, distance: 50, exercise: "Sprint de saída/chegada", style: "crawl", intensity: "VO2", equipment: [], interval: "30" },
                ]
            },
            {
                name: "Soltura",
                items: [
                    { reps: 1, distance: 200, exercise: "Nado solto escolha", style: "freestyle_choice", intensity: "A0", equipment: [], interval: "" },
                ]
            }
        ]
    }
];
