# Painel de Desempenho do Professor (Performance Dashboard)

**Status:** Planejamento Arquitetônico
**Objetivo:** Prover uma ferramenta analítica de altíssimo desempenho e baixíssimo custo no Firestore que consolide o impacto comercial, metodológico e financeiro de um Educador da base (Professores) em forma de dashboard seccionado em Abas.

---

## 1. Visão Geral da Interface de Usuário (Layout)

O layout começará com um controle simples no topo para selecionar o professor sob análise.
Na mudança do professor, uma chamada otimizada carrega o panorama (Aggregated Docs) e alimenta as seções tabuladas.

### Cabeçalho "Profile"
- **Seletor de Professores:** Um Select dropdown com a lista de educadores (filtrados ativamente de `users` com role `teacher`).
- **Resumo Físico (Avatar e Nome):** A foto redonda de perfil do professor selecionado, seu Nome completo.
- **Micro-KPIs no Cabeçalho:**
  - Quantidade Total de Alunos Ativos sob responsabilidade.
  - Carga Horária (Turmas Cadastradas).

### Abas (Tabs System)
Ao ser selecionado o professor, as seguintes "Tabs" serão disponibilizadas para visualizar métricas específicas e aprofundar a análise:

#### Tab 1: Comercial & Retenção 🦈
Foco principal: "Este professor traz alunos para dentro e os mantêm nas raias?". Útil para medir engajamento comportamental do profissional com os pais e alunos.

- **KPI 1: Taxa de Conversão de Experimentais:** % de sucesso (Visitou vs Matriculou), em relação à média geral da unidade.
- **KPI 2: Churn Rate (Evasões):** % e Número absoluto de alunos que cancelaram o plano que tinham a maioria das aulas com este professor.
- **KPI 3: Net Promoter Score (NPS) - Futuro:** Espaço para notas de eventuais coletas de satisfação.
- **Lista/Tabela Dinâmica:** Os nomes e contatos de quem marcou experimental para aquela semana (Alerta p/ aquecimento de lead).

#### Tab 2: Desempenho Metodológico 📈
Foco principal: "Este professor ensina de acordo com as diretrizes e respeita os prazos de aprendizado de forma crível e de qualidade?". O coração da sua escola.

- **KPI 1: Velocity de Nível:** Quantidade Média Fictícia (Ponderação) de Aulas que o aluno leva para se graduar por Nível. (Ex: "Adaptação leva média de 20 aulas para este prof. A média da piscina são 25").
- **KPI 2: "Ready-to-Level":** Quantidade de alunos práticos e engatilhados com "100% dos fundamentos vitais e >=85% das técnicas gerais", aguardando diploma/avançar.
- **Lista Ação Imediata:** Quadro claro listando os alunos que atingiram a marca métrica, e botão que abre um modal direto para carimbar a promoção/avaliação.
- **Lista de "Bloqueados" (Struggling):** Alunos matriculados que ultrapassaram a "Sombra do Fim de Ciclo" (acima da média esperada de aulas). Funciona como um painel de alerta (Red Flag) para o Coordenador intervir metodologicamente.

#### Tab 3: Engajamento Interno & Assiduidade (Operacional) ⚙️
Foco principal: O educador sendo um bom funcionário administrativo, executando com esmero sua rotina e suas presenças da grade.

- **KPI 1: Pontualidade da Chamada (Frequency of Rolls):** Das turmas que este professor deu, % de chamadas realizadas no sistema VS ausência de preenchimento (Gera buracos/reembolsos indevidos).
- **KPI 2: Faltas do Indivíduo / Substituições:** Quando ele falta e um substituto tem que assumir sua turma (Impacta Retenção do cliente, bom acompanhar o "Índice de Substituição").
- **Sino de Lembretes do Sistema:** "Você tem 15 avaliações pendentes a mais de X meses".

---

## 2. Estratégia de Economia Padrão Cloud (Firestore Cost-Saving)

Para montar isso, ler `x` avaliações para `y` avaliados de `z` aulas faria a conta na nuvem explodir rapidamente a cada mudança no `<select>` de professores na tela (cota de leituras diárias estouraria).

### Arquitetura de Cache Agregado

Criaremos uma rotina onde o "peso pesado" ocorre no servidor somente 1x por dia, e preenche a ponta do iceberg (O Documento do Professor) através do conceito de *Materialized Views*.

#### A Coleção `teacherMetrics_aggregated`

Para cada Tenant/Branch, haverá uma subcoleção indexada pelo ID do professor, contendo:

**Rota:** `tenants/{idTenant}/branches/{idBranch}/teacher_metrics/{idUser}`

Estrutura Exemplo do Firebase Document:
```json
{
  "updatedAt": "Timestamp",
  "idTeacher": "XPTO123",
  "name": "Marcos Silva",
  
  "commercialMetrics": {
     "currentMonthTrials": 24,
     "convertedTrials": 10,  // = 41% de conversão (calculado no client pro chart)
     "churnThisMonth": 3
  },
  
  "methodologyMetrics": {
     "totalStudentsAboveThreshold": 4, // 100% fund e 85% gerais batidas.
     "averageLessonsPerLevel": {
         "Peixinho": 24.5,
         "Tubarão": 40.0
     }
  },

  "operationalMetrics": {
      "missingAttendanceClasses": 2, // Ele esqueceu a chamada de 2 turmas
      "replacedClasses": 1 
  }
}
```

### O Script de Preenchimento (Scheduled Function Cloud)
Criaremos um Cloud Function diário: **`aggregateTeacherPerformance` (Cronjob 2am)**

1. A função da nuvem acordará às 2 da manhã em lote.
2. Lerá as coleções cruas (`enrollments`, `attendance`, `evaluations`).
3. Agrupará os resultados (Group By `idInstructor` dos Schedules).
4. Gravará UMA VEZ por dia o PDF JSON resumido no `teacher_metrics/{idUser}`.

**Custo:** Quando a escola usar a aba "Painel de Professores", em vez do sistema bater milhares de leituras vasculhando 5 meses de turmas procurando avaliações, lerá apenas **1 documento** na nuvem, barateando a operação analítica para ser O(1) leitura, entregando dados absurdamente rápidos, fluidos e responsivos ao clicar na aba.

Para o "Hoje", se ele precisar do aluno apto "agora", as Listas Dinâmicas de ready-to-level poderão ser lidas localmente com `Where("status", "==", "ready")`.

## Próximos Passos Físicos de Implementação:

- [ ] Aprovação do Layout e KPIs detalhados.
- [ ] Construção do Arquivo Cloud Function (`processTeacherAggregator`).
- [ ] Criação do Mock Frontend Component (`TeacherDashboard/index.js`).
- [ ] Montagem as Tabs com ChartJS ou Recharts baseadas nos arrays do Doc Unificado.
