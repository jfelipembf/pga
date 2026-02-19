# Plano de Implementação: Sugestão Automática de Objetivos de Ensino (Escopo Semanal)

## Objetivo
Implementar um sistema inteligente no Modal de Planejamento (`PlanningSessionModal`) que sugere **dois objetivos semanais** para a turma. O sistema deve garantir a continuidade do foco durante a semana e adaptar-se dinamicamente, renovando o planejamento após as avaliações.

## 1. Estrutura de Dados: Subcoleção

Para permitir maior flexibilidade e histórico, o planejamento não será mais um campo no documento da sessão, mas sim um documento em uma **subcoleção**.

*   **Caminho:** `sessions/{sessionId}/planning/{planningId}`
*   **Cardinalidade:** Por padrão, haverá apenas um documento ativo (o mais recente) por sessão servindo como o planejamento oficial daquela aula.

```json
// Documento na subcoleção: sessions/SESSION_ID/planning/AUTO_ID
{
  "weekId": "2024-W15", // Identificador da semana para agrupamento
  "createdAt": "timestamp",
  "createdBy": "userId",
  "isWeeklyFocus": true, // Define se esta sessão dita a regra da semana
  "status": "active",
  "objectives": [
    {
      "id": "obj_1",
      "title": "Guarda Fechada",
      "isFundamental": true,
      "reason": "Defasagem atual da turma: 40%"
    },
    {
      "id": "obj_2", 
      "title": "Passagem de Guarda",
      "isFundamental": false
    }
  ]
}
```

## 2. Fluxo: Avaliação -> Renovação do Planejamento

O ciclo de vida do planejamento segue a evolução da turma.

### O Ciclo "Avaliar -> Reanalisar -> Renovar"

1.  **Ação de Avaliar:** O professor realiza a avaliação dos alunos na página de Avaliação (ou ao final da aula). Isso atualiza as estatísticas de prontidão dos alunos no banco de dados (`evaluations`).
2.  **Momento da Reanálise:**
    *   A reanálise ocorre **On-Demand** (sob demanda) quando o professor abre o Modal de Planejamento para a **próxima aula disponível (semana seguinte)**.
    *   *Por que não trigger automático?* Para garantir que a sugestão utilize os dados mais frescos possíveis no momento exato do planejamento, sem custos desnecessários de processamento em background.
3.  **Lógica de Renovação (O Algoritmo):**
    *   Ao carregar, o sistema busca os dados de avaliação mais recentes.
    *   Objetivos que foram trabalhados e bem avaliados na semana anterior terão sua "porcentagem de conclusão" aumentada.
    *   Consequentemente, seu "Score de Defasagem" (Necessidade) diminuirá.
    *   Outros objetivos (ainda não dominados ou fundamentais pendentes) subirão no ranking de prioridade.
    *   **Resultado:** O sistema sugere naturalmente um **novo par de objetivos** para a nova semana, garantindo a rotação de conteúdo baseada em dados reais.

## 3. Regra de Negócio: Planejamento Semanal (Consistência)

Antes de gerar novos objetivos, o sistema verifica a **Consistência Semanal**:

1.  **Ao abrir a Sessão X (ex: Quarta-feira):**
    *   O sistema busca sessões anteriores da **mesma turma** na **mesma semana** (ex: Segunda-feira).
    *   Verifica se existe documento na subcoleção `planning` dessas sessões anteriores.
2.  **Se encontrar Planejamento na Semana:**
    *   **NÃO reanalisa.** O sistema **copia/reaplica** os objetivos da Segunda-feira para a Quarta-feira.
    *   *Motivo:* O usuário solicitou que "os dois objetivos devem ser trabalhados na semana... os mesmos objetivos para os dois dias".
3.  **Se NÃO encontrar (Início de Semana ou Primeira Aula):**
    *   Executa o **Algoritmo de Prioridade** (detalhado abaixo) com os dados atuais.
    *   Salva o novo planejamento na subcoleção da sessão atual como `isWeeklyFocus: true`.

## 4. Algoritmo de Prioridade (A Análise)

A análise deve garantir sempre **1 objetivo Fundamental** (se houver pendência) e **1 Complementar**.

1.  **Calcular Score de Defasagem para cada Objetivo:**
    *   `Deficiencia = 100 - %ConclusaoTurma`
    *   `Score = Deficiencia * Peso`
    *   **Pesos:**
        *   Contém Tópico Fundamental: **3.0**
        *   Apenas Tópicos Gerais: **1.0**

2.  **Seleção:**
    *   **Objetivo A (Fundação):** O objetivo com maior `Score` dentre aqueles que possuem tópicos fundamentais.
    *   **Objetivo B (Complemento):** O objetivo com maior `Score` dentre **todos** os restantes (excluindo A).

## 5. Passo a Passo da Implementação Técnica

1.  **Backend/Service (`SessionService`):**
    *   Adicionar método `savePlanning(sessionId, planningData)`: Grava na subcoleção.
    *   Adicionar método `getPlanning(sessionId)`: Lê da subcoleção.
    *   Adicionar método `findWeeklyPlanning(classId, startOfWeek, endOfWeek)`: Busca planejamentos de outras sessões da semana.

2.  **Frontend (`PlanningSessionModal`):**
    *   **Estado:** `planningObjectives`, `isWeeklyFocus`, `loadingPlanning`.
    *   **Hook (`useEvaluationAnalysis` ou novo `useSessionPlanning`):**
        *   Adicionar função `generateObjectiveSuggestions(objectivesData)` implementando o algoritmo de Score.
    *   **Effect:**
        *   Busca planejamento existente da sessão.
        *   Se null, busca planejamento da semana (sessões irmãs).
        *   Se null, chama `generateObjectiveSuggestions` e prepara sugestão.
    *   **UI:**
        *   Exibir sugestão.
        *   Botão "Confirmar e Salvar" -> Persiste na subcoleção.

## 6. Gatilho de Persistência (Automático)

O salvamento dos dados na subcoleção `planning` ocorrerá **automaticamente** ao abrir o modal, garantindo que o planejamento esteja sempre registrado.

**O Fluxo Automático:**
1.  **Professor abre o modal** da sessão.
2.  **Verificação:** O sistema checa se já existe um documento `planning` para esta sessão.
    *   **Cenário A (Já Existe):** Carrega e exibe o planejamento salvo. Nenhuma alteração é feita.
    *   **Cenário B (Não Existe):**
        1.  Verifica se há planejamento em sessões anteriores da **mesma semana**.
        2.  Se houver, **copia** os objetivos para manter a consistência.
        3.  Se não houver, **gera nova sugestão** baseada nos dados de avaliação mais recentes (priorizando as defasagens atuais).
        4.  **Ação Imediata:** Salva o planejamento gerado (copiado ou novo) na subcoleção da sessão atual e exibe na tela.

## 7. Geração em Lote e Proteção Histórica

### Regra: Planejamento Futuro Completo
Ao invés de gerar planejamento apenas "aula a aula", o sistema deve ter capacidade de **projetar o planejamento para todas as sessões futuras** da turma.

**Gatilho de Geração em Lote:**
*   Pode ser acionado ao abrir o modal de uma aula futura OU após a conclusão de uma avaliação (trigger manual ou automático).
*   O sistema itera sobre as **Semanas Futuras**:
    1.  Calcula a prioridade atual (Defasagem).
    2.  Seleciona Objetivos para a Semana N.
    3.  Seleciona Objetivos para a Semana N+1 (Considerando a rotação de conteúdo, evitando repetição imediata se possível).
    4.  Grava nas subcoleções das respectivas sessões futuras.

### Regra: Imutabilidade do Passado
A atualização dos dados (após uma avaliação onde o aluno melhora) **NUNCA** deve afetar sessões passadas.
*   Planejamentos de aulas já ocorridas (data < hoje) são **históricos imutáveis** do que foi trabalhado, independentemente se o aluno já superou aquela dificuldade ou não.
*   A reanálise/regeneração só pode sobrescrever planejamentos de **sessões futuras** (data > hoje) que ainda não foram executadas.

### Fluxo de Atualização Pós-Avaliação (Refinado)
1.  Aluno é avaliado e melhora nota no Objetivo A.
2.  Sistema detecta mudança de status.
3.  Sistema busca **apenas sessões futuras** desta turma.
4.  Para cada semana futura:
    *   Verifica se o planejamento já está "travado" (aula realizada).
    *   Se não, **recalcula** as prioridades (O Objetivo A agora tem prioridade baixa).
    *   Substitui o planejamento futuro sugerindo agora o Objetivo B (nova maior defasagem).
5.  O professor, ao abrir a próxima aula, verá o **novo** planejamento atualizado com a realidade pós-avaliação.

