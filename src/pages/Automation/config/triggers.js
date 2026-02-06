// Mapeamento de Labels e Categorias
export const TRIGGER_CONFIG = {
    NEW_LEAD: { label: "Novo Lead", category: "Leads", variables: ["{name}"] },
    NEW_CLIENT: { label: "Novo Cliente (Contrato)", category: "Contratos", variables: ["{name}"] },
    EXPERIMENTAL_SCHEDULED: { label: "Aula Experimental Agendada", category: "Aulas Experimentais", variables: ["{student}", "{date}", "{time}"] },
    EXPERIMENTAL_SCHEDULED_TEACHER: { label: "Aula Experimental (Prof.)", category: "Aulas Experimentais", variables: ["{student}", "{date}", "{time}"] },
    EXPERIMENTAL_CLASS_DAY_BEFORE: { label: "Lembrete Dia Anterior", category: "Aulas Experimentais", variables: ["{name}"] },
    EXPERIMENTAL_ABSENCE: { label: "Faltou à Aula (No Show)", category: "Aulas Experimentais", variables: ["{name}"] },
    EXPERIMENTAL_MISSED: { label: "Faltou à Aula", category: "Aulas Experimentais", variables: ["{name}"] },
    EXPERIMENTAL_ATTENDED: { label: "Compareceu à Aula", category: "Aulas Experimentais", variables: ["{name}"] },
    CONTRACT_EXPIRING: { label: "Contrato Vencendo", category: "Contratos", variables: ["{name}", "{date}"] },
    CONTRACT_RENEWED: { label: "Contrato Renovado", category: "Contratos", variables: ["{name}"] },
    ENROLLMENT_CREATED: { label: "Nova Matrícula", category: "Contratos", variables: ["{name}"] },
    EVALUATION_RESULT: { label: "Resultado da Avaliação", category: "Pedagógico", variables: ["{student}", "{results}", "{date}"] },
    TEST_RESULT: { label: "Resultado do Teste", category: "Pedagógico", variables: ["{name}"] },
    BIRTHDAY: { label: "Aniversariante", category: "Relacionamento", variables: ["{name}"] },
}

export const TRIGGER_LABELS = Object.keys(TRIGGER_CONFIG).reduce((acc, key) => {
    acc[key] = TRIGGER_CONFIG[key].label
    return acc
}, {})

export const DEFAULT_MESSAGES = {
    NEW_LEAD: "Oi {name}! 👋 Tudo bem? Vimos que você tem interesse na nossa academia. Que tal agendar uma visita para conhecer de perto? 🏊‍♂️",
    NEW_CLIENT: "Bem-vindo(a) ao time, {name}! 🌊 Estamos muito felizes em ter você com a gente. Prepare a touca e os óculos, porque vai ser incrível!",
    EXPERIMENTAL_SCHEDULED: "Oi {student}! 🤩 Sua aula experimental está confirmadíssima!\n\n📅 Data: {date}\n⏰ Hora: {time}\n\nEstamos ansiosos para te receber! Qualquer dúvida, é só chamar. Até lá! 🏊‍♂️",
    EXPERIMENTAL_SCHEDULED_TEACHER: "Fala Prof! 🚀 Tem gente nova chegando para nadar!\n\nAluno: {student}\nData: {date} às {time}\n\nCapricha na aula que esse vai longe! 💪",
    EXPERIMENTAL_CLASS_DAY_BEFORE: "Oi {name}! Amanhã é o grande dia da sua aula experimental! 🎉\n\nNão esqueça:\n✅ Touca e óculos de natação\n✅ Se for bebê, o responsável também precisa de touca\n✅ Chegue 10 minutinhos antes\n\nEstamos te esperando para uma experiência incrível! 💙",
    EXPERIMENTAL_ABSENCE: "Olá {name}, notamos que você não compareceu à aula experimental hoje. Espero que esteja tudo bem! Qual o melhor horário para remarcarmos?",
    EXPERIMENTAL_MISSED: "Oi {name}, sentimos sua falta na aula experimental hoje. 😕 Aconteceu algum imprevisto? Vamos reagendar para você não perder essa chance?",
    EXPERIMENTAL_ATTENDED: "E aí {name}, curtiu a aula? 🏊‍♂️ Esperamos que sim! O que acha de oficializar sua matrícula e começar a treinar com a gente de vez?",
    CONTRACT_EXPIRING: "Oi {name}! O seu plano vence dia {date}. Renove agora para continuar seus treinos sem interrupção. 🚀",
    CONTRACT_RENEWED: "Renovadíssimo! 🎉 Obrigado por continuar com a gente, {name}. Vamos juntos buscar novos recordes!",
    EVALUATION_RESULT: "Olá {studentName}, parabéns por finalizar mais uma avaliação aqui na A2 Aquática! 🏊‍♂️\n\nEssa é a recompensa de todo o seu esforço e dedicação. Continue assim!\n\nAbaixo segue o resultado da sua última avaliação realizada no dia {date}:\n\n{results}\n\nConte conosco para continuar evoluindo! 💪",
    TEST_RESULT: "Mandou bem, {name}! 📝 Seu resultado no teste já está registrado. Continue assim!",
    ENROLLMENT_CREATED: "Matrícula confirmada! 📝 Seja muito bem-vindo(a), {name}! Agora é só cair na água. 🏊‍♂️",
    BIRTHDAY: "Parabéns {name}! 🎂 Muitos anos de vida, saúde e muitas braçadas! Aproveite seu dia! 🎉",
}
