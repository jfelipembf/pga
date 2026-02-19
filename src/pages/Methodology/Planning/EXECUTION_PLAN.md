# Arquitetura e Plano de Execução: Sistema de Planejamento de Aulas

Este documento detalha o plano de execução técnica para implementar o sistema de Sugestão Automática de Objetivos de Ensino, abrangendo alterações no Frontend, Backend (serviços) e Estrutura de Dados.

## 1. Visão Geral da Arquitetura

O sistema operará em um modelo híbrido:
1.  **On-Demand:** O planejamento é carregado/gerado ao abrir o `PlanningSessionModal`.
2.  **Batch Processing (Lote):** Quando necessário (ex: pós-avaliação ou primeiro acesso), o sistema projeta planejamentos para sessões futuras.
3.  **Persistência:** Subcoleção `planning` dentro de cada documento `sessions/{sessionId}`.

## 2. Serviços e Arquivos Impactados

### A. Camada de Dados e Serviços (Backend Logic)

#### 1. `src/services/Classes/SessionService.js` (CRÍTICO)
Este arquivo centralizará a lógica de persistência e recuperação dos planejamentos.
*   **Modificações Necessárias:**
    *   **Importar:** Funções de subcoleção do Firestore (se necessário, ou usar repositório genérico).
    *   **Novo Método:** `getPlanning(idTenant, idBranch, sessionId)`
        *   Busca o documento ativo na subcoleção `planning`.
    *   **Novo Método:** `savePlanning(idTenant, idBranch, sessionId, planningData)`
        *   Salva/Atualiza o documento na subcoleção.
    *   **Novo Método:** `findPlanningForWeek(idTenant, idBranch, classId, startDate, endDate)`
        *   Query complexa para encontrar se JÁ EXISTE um planejamento na mesma semana para a mesma turma.
    *   **Novo Método:** `generateFuturePlannings(idTenant, idBranch, classId, evaluationStats)`
        *   Implementar a lógica de iteração sobre sessões futuras (> hoje).
        *   Para cada semana futura, calcular e salvar os objetivos baseados na "defasagem" atual.

#### 2. `src/pages/Methodology/Planning/hooks/useEvaluationAnalysis.js` (IMPORTANTE)
Este hook já calcula as estatísticas (`objectivesData`). Precisamos extrair ou reutilizar essa lógica para alimentar o gerador de sugestões.
*   **Modificações:**
    *   Garantir que `objectivesData` exponha as métricas de "defasagem" (100 - progresso) de forma clara para ser consumida pelo algoritmo de sugestão.

#### 3. `src/pages/Methodology/Planning/hooks/useSessionPlanning.js` (NOVO ARQUIVO)
Criar um hook dedicado para separar a lógica de *Planejamento* da lógica de *Análise*.
*   **Responsabilidades:**
    *   Gerenciar estado `planning`.
    *   Conter o **Algoritmo de Prioridade** (Ranking de Objetivos).
    *   Orquestrar a chamada ao `SessionService` para buscar/salvar.
    *   Verificar consistência semanal (chamando `findPlanningForWeek`).

### B. Camada de Apresentação (Frontend)

#### 1. `src/pages/Methodology/Planning/components/PlanningSessionModal.js`
*   **Modificações:**
    *   Importar e usar `useSessionPlanning`.
    *   **Nova Seção de UI:** "Objetivos da Aula (Planejamento Semanal)".
    *   Exibir os 2 cards de objetivos sugeridos.
    *   Mostrar status (Carregando, Salvo Automaticamente, Histórico Herdado).

#### 2. `src/pages/Methodology/Evaluation/EvaluationPage.js` (ou componente similar de finalização)
*   **Modificações:**
    *   Após o sucesso de uma avaliação (`EvaluationService.save` ou similar), disparar o gatilho de regeneração futura.
    *   Chamar `SessionService.generateFuturePlannings` (em background ou com toast de progresso) para atualizar as próximas aulas com base nos novos resultados.

## 3. Detalhamento do Algoritmo de Prioridade (`useSessionPlanning.js`)

```javascript
/* Pseudocódigo do Algoritmo */
function calculateSuggestions(objectivesData) {
    // 1. Calcular Scores
    const ranked = objectivesData.map(obj => {
        const gap = 100 - obj.averagePercentage; // Quanto falta (Defasagem)
        const isFund = obj.topics.some(t => t.isFundamental);
        const weight = isFund ? 3.0 : 1.0;
        return { ...obj, score: gap * weight, isFundamental: isFund };
    }).sort((a, b) => b.score - a.score);

    // 2. Selecionar Objetivo Fundamental Obrigatório
    let fundObj = ranked.find(o => o.isFundamental);
    if (!fundObj) fundObj = ranked[0]; // Fallback

    // 3. Selecionar Objetivo Complementar
    const compObj = ranked.find(o => o.id !== fundObj.id);

    return [fundObj, compObj];
}
```

## 4. Plano de Execução Sequencial

1.  **Fase 1: Infraestrutura (Services)**
    *   Implementar métodos de leitura/escrita de subcoleção no `SessionService`.
    *   Implementar query de busca semanal.

2.  **Fase 2: Lógica de Negócio (Hooks)**
    *   Criar `useSessionPlanning.js`.
    *   Implementar algoritmo de sugestão.
    *   Implementar lógica "Auto-Save on Open".

3.  **Fase 3: Interface (Modal)**
    *   Alterar `PlanningSessionModal` para exibir o planejamento.
    *   Testar fluxo de abertura -> geração -> salvamento.

4.  **Fase 4: Integração Futura (Batch)**
    *   Implementar `generateFuturePlannings` no Service.
    *   Conectar ao evento de conclusão de avaliação.

## 5. Cuidados e Restrições
*   **Concorrência:** Garantir que se dois professores abrirem a mesma aula, o primeiro a gerar "ganha" e o segundo lê o salvo. (O Firestore trata isso bem com leituras atômicas, mas aqui a probabilidade é baixa).
*   **Performance:** A geração em lote (Fase 4) pode ser pesada se houver muitas aulas futuras. Limitar a um horizonte de tempo (ex: próximas 4 semanas).
