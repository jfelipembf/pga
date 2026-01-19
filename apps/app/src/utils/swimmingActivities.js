
export const SWIMMING_ACTIVITIES_DEFAULT = [
    {
        name: "Bebê 1",
        description: "Até 12 meses",
        color: "#4FC3F7", // Light Blue
        objectives: [
            {
                id: "obj-b1-1",
                title: "Motor/aquático",
                topics: [
                    { id: "top-b1-1-1", description: "Submergir a cabeça com bloqueio respiratório" },
                    { id: "top-b1-1-2", description: "Flutuar dorsal" },
                    { id: "top-b1-1-3", description: "Equilibrar-se em diferentes posições" },
                    { id: "top-b1-1-4", description: "Movimentar braços e pernas" },
                    { id: "top-b1-1-5", description: "Entrar na água sentado com auxílio" }
                ]
            },
            {
                id: "obj-b1-2",
                title: "Social/cognitivo",
                topics: [
                    { id: "top-b1-2-1", description: "Interagir com professores/pais/bebês" },
                    { id: "top-b1-2-2", description: "Reconhecer músicas e movimentos" },
                    { id: "top-b1-2-3", description: "Demonstrar preferências e gosto por repetição" }
                ]
            }
        ]
    },
    {
        name: "Bebê 2",
        description: "13 a 24 meses",
        color: "#29B6F6", // Blue
        objectives: [
            {
                id: "obj-b2-1",
                title: "Motor/aquático",
                topics: [
                    { id: "top-b2-1-1", description: "Submergir a cabeça com auxílio (repetições)" },
                    { id: "top-b2-1-2", description: "Flutuar com mudança de decúbito" },
                    { id: "top-b2-1-3", description: "Equilibrar-se e deslocar-se com independência" },
                    { id: "top-b2-1-4", description: "Saltar e retornar à borda" }
                ]
            },
            {
                id: "obj-b2-2",
                title: "Social/cognitivo",
                topics: [
                    { id: "top-b2-2-1", description: "Interação por imitação e exploração do ambiente/objetos (estratégias para buscar brinquedos)" }
                ]
            }
        ]
    },
    {
        name: "Bebê 3",
        description: "25 a 36 meses",
        color: "#03A9F4", // Darker Blue
        objectives: [
            {
                id: "obj-b3-1",
                title: "Motor/aquático",
                topics: [
                    { id: "top-b3-1-1", description: "Controle respiratório autônomo" },
                    { id: "top-b3-1-2", description: "Flutuar por mais tempo com mudanças de decúbito" },
                    { id: "top-b3-1-3", description: "Equilíbrio com maior dificuldade" },
                    { id: "top-b3-1-4", description: "Deslocar-se 5m" },
                    { id: "top-b3-1-5", description: "Saltar e nadar com roupas" }
                ]
            },
            {
                id: "obj-b3-2",
                title: "Social/cognitivo",
                topics: [
                    { id: "top-b3-2-1", description: "Aceitar regras" },
                    { id: "top-b3-2-2", description: "Jogos simbólicos/representação de histórias" },
                    { id: "top-b3-2-3", description: "Imaginação e fantasia" }
                ]
            }
        ]
    },
    {
        name: "Adaptação",
        description: "A partir de 3 anos",
        color: "#8BC34A", // Green
        objectives: [
            {
                id: "obj-ad-1",
                title: "Motor/aquático",
                topics: [
                    { id: "top-ad-1-1", description: "Controlar ritmo respiratório" },
                    { id: "top-ad-1-2", description: "Flutuar com mudança de decúbitos" },
                    { id: "top-ad-1-3", description: "Equilíbrio com deslocamento" },
                    { id: "top-ad-1-4", description: "Propulsão rudimentar dos nados" },
                    { id: "top-ad-1-5", description: "Saltos + movimentos combinados (autossalvamento)" }
                ]
            },
            {
                id: "obj-ad-2",
                title: "Social/cognitivo",
                topics: [
                    { id: "top-ad-2-1", description: "Aceitar regras de adultos com vínculo afetivo" }
                ]
            }
        ]
    },
    {
        name: "Iniciação",
        description: "A partir de 4 anos",
        color: "#FFEB3B", // Yellow
        objectives: [
            {
                id: "obj-ini-1",
                title: "Técnica e Habilidades",
                topics: [
                    { id: "top-ini-1-1", description: "Nadar crawl com respiração lateral" },
                    { id: "top-ini-1-2", description: "Costas completo" },
                    { id: "top-ini-1-3", description: "Pernada do peito" },
                    { id: "top-ini-1-4", description: "Ondulação" },
                    { id: "top-ini-1-5", description: "Cambalhota" },
                    { id: "top-ini-1-6", description: "Saltos/mergulho elementar sem auxílio" },
                    { id: "top-ini-1-7", description: "Deslizes ventral/dorsal" },
                    { id: "top-ini-1-8", description: "Nado submerso" },
                    { id: "top-ini-1-9", description: "Impulsão dorsal" },
                    { id: "top-ini-1-10", description: "Autossalvamento" }
                ]
            },
            {
                id: "obj-ini-2",
                title: "Social/cognitivo",
                topics: [
                    { id: "top-ini-2-1", description: "Interação/organização e decisões na tarefa (regras, desafios e convivência)" }
                ]
            }
        ]
    },
    {
        name: "Aperfeiçoamento 1",
        description: "A partir de 6 anos",
        color: "#FF9800", // Orange
        objectives: [
            {
                id: "obj-ap1-1",
                title: "Técnica",
                topics: [
                    { id: "top-ap1-1-1", description: "Ajustar sincronização no crawl e costas" },
                    { id: "top-ap1-1-2", description: "Nadar peito completo" },
                    { id: "top-ap1-1-3", description: "Pernada do borboleta" },
                    { id: "top-ap1-1-4", description: "Viradas simples (crawl/costas)" },
                    { id: "top-ap1-1-5", description: "Saídas do crawl/costas (borda e bloco)" }
                ]
            },
            {
                id: "obj-ap1-2",
                title: "Social/cognitivo",
                topics: [
                    { id: "top-ap1-2-1", description: "Regras e cooperação" },
                    { id: "top-ap1-2-2", description: "Propor alternativas e resolver problemas simples" },
                    { id: "top-ap1-2-3", description: "Analisar resultado e explicar a dinâmica da tarefa" }
                ]
            }
        ]
    },
    {
        name: "Aperfeiçoamento 2",
        description: "A partir de 7 anos",
        color: "#FF5722", // Deep Orange
        objectives: [
            {
                id: "obj-ap2-1",
                title: "Técnica",
                topics: [
                    { id: "top-ap2-1-1", description: "Crawl e costas com foco em equilíbrio corporal" },
                    { id: "top-ap2-1-2", description: "Entrada/saída correta da braçada (crawl/costas)" },
                    { id: "top-ap2-1-3", description: "Peito com melhor sincronização (braçada–respiração–pernada)" },
                    { id: "top-ap2-1-4", description: "Borboleta completo" },
                    { id: "top-ap2-1-5", description: "Viradas olímpicas (crawl/costas)" },
                    { id: "top-ap2-1-6", description: "Virada e saída do peito com filipina" },
                    { id: "top-ap2-1-7", description: "Virada do borboleta" }
                ]
            },
            {
                id: "obj-ap2-2",
                title: "Social/cognitivo",
                topics: [
                    { id: "top-ap2-2-1", description: "Regras e lidar com frustrações" },
                    { id: "top-ap2-2-2", description: "Cooperar e tomar decisões mais completas" },
                    { id: "top-ap2-2-3", description: "Entender infos complexas e resolver problemas com mais de uma solução" }
                ]
            }
        ]
    },
    {
        name: "Aperfeiçoamento 3",
        description: "A partir de 8 anos",
        color: "#F44336", // Red
        objectives: [
            {
                id: "obj-ap3-1",
                title: "Ritmo e Resistência",
                topics: [
                    { id: "top-ap3-1-1", description: "Sustentar ritmo constante: crawl/costas/peito (25 a 50m)" },
                    { id: "top-ap3-1-2", description: "Sustentar ritmo constante: borboleta (12 a 25m)" }
                ]
            },
            {
                id: "obj-ap3-2",
                title: "Regras Oficiais",
                topics: [
                    { id: "top-ap3-2-1", description: "Viradas com ondulação submersa" },
                    { id: "top-ap3-2-2", description: "Peito com filipina e ondulação" },
                    { id: "top-ap3-2-3", description: "Saídas com ondulação" },
                    { id: "top-ap3-2-4", description: "Transições do medley" }
                ]
            },
            {
                id: "obj-ap3-3",
                title: "Objetivos Sócio-Cognitivos",
                topics: [
                    { id: "top-ap3-3-1", description: "Respeitar diferenças e propor alternativas ao grupo" },
                    { id: "top-ap3-3-2", description: "Dar o melhor (competitivo/cooperativo)" },
                    { id: "top-ap3-3-3", description: "Decidir olhando o todo da tarefa e resolver problemas complexos" }
                ]
            }
        ]
    },
    {
        name: "Adaptação Adulto",
        description: "A partir de 13 anos",
        color: "#9E9E9E", // Grey
        objectives: [
            {
                id: "obj-adult-ad-1",
                title: "Objetivo Geral",
                topics: [
                    { id: "top-adult-ad-1-1", description: "Consciência corporal no meio aquático" },
                    { id: "top-adult-ad-1-2", description: "Habilidades básicas (respiração, flutuação, equilíbrio, propulsão)" },
                    { id: "top-adult-ad-1-3", description: "Movimentos combinados e autossalvamento" }
                ]
            },
            {
                id: "obj-adult-ad-2",
                title: "Conteúdos Trabalhados",
                topics: [
                    { id: "top-adult-ad-2-1", description: "Controle e ritmo respiratório" },
                    { id: "top-adult-ad-2-2", description: "Flutuações (ventral/dorsal/grupada)" },
                    { id: "top-adult-ad-2-3", description: "Equilíbrio com mudanças de posição/direção e deslizes" },
                    { id: "top-adult-ad-2-4", description: "Propulsões e combinações com respiração + autossalvamento" }
                ]
            }
        ]
    },
    {
        name: "Iniciação Adulto",
        description: "A partir de 13 anos",
        color: "#607D8B", // Blue Grey
        objectives: [
            {
                id: "obj-adult-ini-1",
                title: "Segurança Aquática",
                topics: [
                    { id: "top-adult-ini-1-1", description: "Orientar-se submerso" },
                    { id: "top-adult-ini-1-2", description: "Desviar obstáculos" },
                    { id: "top-adult-ini-1-3", description: "Autossalvamento (se defender de ondas)" }
                ]
            },
            {
                id: "obj-adult-ini-2",
                title: "Técnica Básica",
                topics: [
                    { id: "top-adult-ini-2-1", description: "Crawl com respiração lateral e sincronização" },
                    { id: "top-adult-ini-2-2", description: "Costas completo" },
                    { id: "top-adult-ini-2-3", description: "Nado submerso e viradas simples (crawl/costas)" }
                ]
            },
            {
                id: "obj-adult-ini-3",
                title: "Autocompetência Aquática",
                topics: [
                    { id: "top-adult-ini-3-1", description: "Flutuação, sustentação, deslocamento e saltos (práticas com roupa)" }
                ]
            }
        ]
    },
    {
        name: "Condicionamento 1 e 2",
        description: "A partir de 13 anos",
        color: "#795548", // Brown
        objectives: [
            {
                id: "obj-cond-1",
                title: "Foco Principal",
                topics: [
                    { id: "top-cond-1-1", description: "Qualidade de vida/saúde" },
                    { id: "top-cond-1-2", description: "Melhorar aptidão física (cardiorrespiratório, força, flexibilidade)" }
                ]
            },
            {
                id: "obj-cond-2",
                title: "Objetivos Específicos",
                topics: [
                    { id: "top-cond-2-1", description: "Criar hábito de atividade física" },
                    { id: "top-cond-2-2", description: "Ganho de capacidades físicas" },
                    { id: "top-cond-2-3", description: "Ajustar ritmo conforme metragem e dominar percepção de esforço" },
                    { id: "top-cond-2-4", description: "Melhorar eficiência dos nados (técnicas dos 4 nados)" },
                    { id: "top-cond-2-5", description: "Saídas, viradas e uso de materiais técnicos" }
                ]
            },
            {
                id: "obj-cond-3",
                title: "Segurança Aquática",
                topics: [
                    { id: "top-cond-3-1", description: "Deslocamento submerso e desviar obstáculos" },
                    { id: "top-cond-3-2", description: "Reboque e crawl polo" }
                ]
            }
        ]
    },
    {
        name: "Fast Swim",
        description: "13 a 18 anos (Pós-AP3, sem foco competitivo)",
        color: "#9C27B0", // Purple
        objectives: [
            {
                id: "obj-fast-1",
                title: "Objetivo",
                topics: [
                    { id: "top-fast-1-1", description: "Saúde, qualidade de vida e manter estilo de vida ativo" },
                    { id: "top-fast-1-2", description: "Preparação física geral (maratonas, outros esportes)" }
                ]
            },
            {
                id: "obj-fast-2",
                title: "Conteúdos Técnicos e Físicos",
                topics: [
                    { id: "top-fast-2-1", description: "Técnicas dos 4 nados, saídas e viradas" },
                    { id: "top-fast-2-2", description: "Séries para capacidades físicas (resistência, potência, velocidade)" },
                    { id: "top-fast-2-3", description: "Intensidades de nado (PSE/tempos)" },
                    { id: "top-fast-2-4", description: "Treino complementar fora d'água" }
                ]
            }
        ]
    },
    {
        name: "Equipe",
        description: "8 a 19 anos (Pós-AP3, foco competitivo)",
        color: "#EF6C00", // Dark Orange
        objectives: [
            {
                id: "obj-eq-1",
                title: "Objetivos",
                topics: [
                    { id: "top-eq-1-1", description: "Iniciação ao treinamento por categoria (CBDA)" },
                    { id: "top-eq-1-2", description: "Aprimorar técnicas, saídas e viradas (regras oficiais)" },
                    { id: "top-eq-1-3", description: "Aprender rotinas de competição" },
                    { id: "top-eq-1-4", description: "Socialização, motivação e hábito de treinar" }
                ]
            },
            {
                id: "obj-eq-2",
                title: "Treinamento Formativo",
                topics: [
                    { id: "top-eq-2-1", description: "Direcionamento técnico e fisiológico" },
                    { id: "top-eq-2-2", description: "Ênfase em fase submersa" },
                    { id: "top-eq-2-3", description: "Ritmos e táticas de prova" },
                    { id: "top-eq-2-4", description: "Trabalho por intensidades" }
                ]
            }
        ]
    }
]
