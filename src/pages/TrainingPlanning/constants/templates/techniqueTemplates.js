export const TECHNIQUE_TEMPLATES = [
    {
        id: "technique_efficiency",
        name: "🎯 Eficiência e Apoio",
        category: "main",
        objective: "technique",
        targetDistance: "general",
        description: "Foco na fase de apoio, tração e redução de arrasto.",
        sections: [
            {
                name: "Aquecimento",
                items: [
                    { reps: 1, distance: 300, exercise: "Livre focado em técnica", style: "crawl", intensity: "A1", equipment: [], interval: "" },
                ]
            },
            {
                name: "Trabalho Técnico",
                items: [
                    { reps: 4, distance: 50, exercise: "Catch-up drill", style: "drills", intensity: "TEC", equipment: ["snorkel"], interval: "20" },
                    { reps: 4, distance: 50, exercise: "Sculling (Palman de frente)", style: "drills", intensity: "TEC", equipment: ["finger_paddles"], interval: "20" },
                    { reps: 4, distance: 50, exercise: "Punho cerrado", style: "drills", intensity: "TEC", equipment: [], interval: "20" },
                    { reps: 4, distance: 100, exercise: "Nado completo - Aplicar técnica", style: "crawl", intensity: "A1", equipment: [], interval: "30" },
                ]
            },
            {
                name: "Soltura",
                items: [
                    { reps: 1, distance: 200, exercise: "Livre solto", style: "freestyle_choice", intensity: "A0", equipment: [], interval: "" },
                ]
            }
        ]
    }
];
