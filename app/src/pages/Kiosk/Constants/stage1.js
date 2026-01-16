export const stage1Data = {
    title: "Estágio 1",
    description: "Crianças que já dominam a `água básica` e começam a virar nadadores: deslize, respiração, pernadas e primeiras braçadas de crawl.",
    generalObjectives: [
        "Desenvolver controle respiratório na água, explorando diferentes formas de expiração.",
        "Realizar flutuação em decúbito dorsal e ventral de forma independente.",
        "Executar deslize ventral e dorsal, com retorno à posição em pé sem auxílio.",
        "Iniciar e consolidar o nado crawl, com foco em pernada, braçada e respiração coordenadas.",
        "Viver a experiência da saída em deslize, conectando impulso na parede e início do nado.",
        "Experimentar o nado de sobrevivência, retornando à borda após o salto.",
        "Iniciar e aprimorar a pernada de costas como base para o futuro nado de costas."
    ],
    objectives: [
        {
            id: 1,
            title: "Controle respiratório",
            topics: [
                { id: "estagio1_respiracao_bolhas", label: "Faz bolhas ao mergulhar, de forma contínua." },
                { id: "estagio1_respiracao_boca_nariz", label: "Alterna expiração pela boca e pelo nariz." },
                { id: "estagio1_respiracao_ritmo", label: "Inspira pela boca e expira pelo nariz, com ritmo." }
            ]
        },
        {
            id: 2,
            title: "Flutuação",
            topics: [
                { id: "estagio1_flut_dorsal", label: "Faz flutuação em decúbito dorsal de forma estável." },
                { id: "estagio1_flut_ventral", label: "Faz flutuação em decúbito ventral, com rosto na água." },
                { id: "estagio1_flut_alternancia", label: "Alterna flutuação ventral/dorsal (vira de barriga para cima e para baixo na água)." }
            ]
        },
        {
            id: 3,
            title: "Deslize",
            topics: [
                { id: "estagio1_deslize_ventral", label: "Desliza na posição ventral em flecha (streamline)." },
                { id: "estagio1_deslize_dorsal", label: "Desliza na posição dorsal em flecha." },
                { id: "estagio1_deslize_impulso", label: "Desliza após o salto ou impulso da parede." },
                { id: "estagio1_deslize_remonta", label: "Remonta à posição em pé após o deslize, sem auxílio." }
            ]
        },
        {
            id: 4,
            title: "Pernada de crawl",
            topics: [
                { id: "estagio1_pernada_material", label: "Faz pernada de crawl com deslocamento utilizando material (prancha ou similar)." },
                { id: "estagio1_pernada_sem_material", label: "Faz pernada de crawl com deslocamento sem auxílio de material, mantendo ritmo." }
            ]
        },
        {
            id: 5,
            title: "Braçada de crawl",
            topics: [
                { id: "estagio1_braçada_material", label: "Faz braçada de crawl com deslocamento utilizando apoio de material, focando no “puxar a água”." },
                { id: "estagio1_braçada_sem_material", label: "Faz braçada de crawl com deslocamento sem material, mantendo o trajeto da mão na água." }
            ]
        },
        {
            id: 6,
            title: "Coordenação de crawl",
            topics: [
                { id: "estagio1_coord_parcial", label: "Coordena movimentos de braçada e pernada de crawl em pequenos percursos." },
                { id: "estagio1_coord_completa", label: "Coordena braçada, pernada e respiração de crawl, ainda que com pequenas pausas." }
            ]
        },
        {
            id: 7,
            title: "Saída de crawl",
            topics: [
                { id: "estagio1_saida_posicao", label: "Faz a saída de crawl a partir da posição sentada, com corpo horizontalizado." },
                { id: "estagio1_saida_streamline", label: "Realiza posição streamline (braços estendidos à frente e pernas estendidas) após o salto ou impulso." },
                { id: "estagio1_saida_conexao", label: "Conecta a saída ao nado, transformando o deslize nos primeiros ciclos de crawl." }
            ]
        },
        {
            id: 8,
            title: "Nado de sobrevivência",
            topics: [
                { id: "estagio1_sobrevivencia_retornar", label: "Após o salto, consegue retornar à borda sem auxílio (cerca de 5 m), utilizando qualquer forma de deslocamento ensinada." }
            ]
        },
        {
            id: 9,
            title: "Pernada de costas",
            topics: [
                { id: "estagio1_pernada_costas_material", label: "Faz pernada de costas com auxílio de material (prancha ou flutuador)." },
                { id: "estagio1_pernada_costas_sem", label: "Faz pernada de costas sem auxílio de material, mantendo quadril próximo à superfície." }
            ]
        }
    ]
}

export const LEVELS = {
    NOT_EVALUATED: { label: "Não avaliado", color: "secondary", icon: "mdi-minus" },
    BEGINNER: { label: "Iniciante", color: "danger", icon: "mdi-star-outline" },
    REGULAR: { label: "Regular", color: "warning", icon: "mdi-star-half" },
    GOOD: { label: "Bom", color: "info", icon: "mdi-star" },
    VERY_GOOD: { label: "Muito bom", color: "success", icon: "mdi-check-decagram" }
}
