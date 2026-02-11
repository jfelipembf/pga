# Plano de Implementação: Módulo de CRM (Customer Relationship Management)

## 1. Visão Geral
O objetivo deste módulo é centralizar a gestão do relacionamento com alunos e leads, permitindo acompanhar o ciclo de vida (Funil de Vendas e Retenção), registrar interações (chamadas, notas, tarefas) e visualizar indicadores de saúde do cliente (financeiro e frequência).

## 2. Estrutura de Dados e Integrações

### Dados Existentes (Leitura)
O CRM irá consumir e cruzar dados dos seguintes módulos já existentes:

1.  **Clientes (`ClientService`)**:
    *   Dados Cadastrais: Nome, Telefone, Email, Foto.
    *   Status do Ciclo de Vida: `lifecycleStatus` (lead, active, suspended, lost).
    *   Origem/Data de Conversão.

2.  **Contratos (`ClientContractService`)**:
    *   Vigência: Data Início/Fim.
    *   Status do Contrato: Ativo, Suspenso, Cancelado.
    *   Classificação de Venda: `new`, `renewal`, `winback`.

3.  **Financeiro (`ReceivableService`)**:
    *   Inadimplência: Faturas em atraso.
    *   Ticket Médio (LTV potencial).

4.  **Automação (`MessagingService`)**:
    *   Envio rápido de mensagens (WhatsApp).

### Novos Dados (Escrita)
Será criada uma nova coleção `crm_interactions` para armazenar o histórico de relacionamento manual.

#### Schema: `CRMInteractionSchema`
```javascript
{
    id: string,
    idTenant: string,
    idBranch: string,
    idClient: string,
    type: 'note' | 'call' | 'whatsapp' | 'meeting' | 'task',
    status: 'pending' | 'done', // Para tarefas
    priority: 'low' | 'medium' | 'high',
    dueDate: Date, // Para agendamento de follow-up
    content: string, // Descrição da interação
    createdBy: string, // ID do usuário (Staff)
    createdAt: Date
    completedAt: Date
}
```

## 3. Arquitetura Proposta

### Camada de Serviço (`src/services/CRM`)
*   **`CRMService.js`**:
    *   `getPipeline(idTenant, idBranch)`: Retorna clientes agrupados por `lifecycleStatus` ou etapa do funil (Lead -> Contato -> Visita -> Conversão).
    *   `getChurnRisks(idTenant, idBranch)`: Retorna lista de alunos com contratos vencendo em X dias ou inadimplentes.
    *   `addInteraction(interactionData)`: Salva nota/tarefa.
    *   `getClientHistory(idClient)`: Retorna timeline unificada (Contratos + Interações + Notas).

### Camada de Repositório (`src/data/repositories`)
*   **`CRMRepository.js`**: Abstração para acesso à coleção `crm_interactions`.

### Camada de Interface (`src/pages/CRM`)

#### Estrutura de Pastas
```
src/pages/CRM/
├── components/
│   ├── PipelineBoard.js       # Visualização Kanban do Funil
│   ├── ClientCRMCard.js       # Card resumido do cliente (na coluna)
│   ├── InteractionTimeline.js # Histórico de notas/tarefas
│   ├── AddInteractionModal.js # Modal para nova nota/tarefa
│   └── Filters/               # Filtros avançados (Status, Vencimento, Dívida)
├── hooks/
│   └── useCRM.js              # Lógica de estados e chamadas de serviço
├── CRMPage.js                 # Página principal (Container)
└── styles.scss                # Estilos específicos
```

## 4. Funcionalidades da Página CRM

### Dashboards e KPIs (Topo da Página)
*   Total de Leads (Novos vs Em Negociação)
*   Conversões no Mês
*   Taxa de Churn (Perdidos)
*   Tarefas Pendentes (Follow-ups atrasados)

### Modos de Visualização
1.  **Kanban (Pipeline)**:
    *   Colunas baseadas em `lifecycleStatus` ou tags personalizadas.
    *   Drag-and-drop para mudar status (ex: arrastar de "Lead" para "Visitou").
2.  **Lista Avançada (Retenção)**:
    *   Tabela com colunas focadas em saúde: "Dias sem vir", "Faturas Atrasadas", "Fim de Contrato".
    *   Ações em massa: "Enviar WhatsApp", "Adicionar Tarefa".

### Detalhe do Cliente (Sidebar/Modal)
Ao clicar em um cliente no CRM:
*   Cabeçalho: Foto, Nome, Status Real (`calculateLiveStatus`).
*   Abas:
    1.  **Resumo**: Contrato atual, financeiro pendente.
    2.  **Timeline**: Histórico de interações (notas, ligações) + Eventos do Sistema (criou contrato, suspendeu, etc).
    3.  **Tarefas**: Próximos passos agendados.

## 5. Plano de Execução

### Fase 1: Backend e Serviços (Foundation)
1.  Criar `CRMInteractionSchema`.
2.  Criar `CRMRepository`.
3.  Criar `CRMService` com métodos básicos de leitura e escrita.

### Fase 2: Interface Principal (UI)
1.  Criar rota `/crm` e adicionar ao Menu.
2.  Implementar Layout Básico da `CRMPage`.
3.  Criar Componente `PipelineBoard` (Mockado inicialmente).

### Fase 3: Integração e Interatividade
1.  Conectar `PipelineBoard` ao `CRMService`.
2.  Implementar Drag-and-drop para atualização rápida de status.
3.  Criar Modal de Interações (Adicionar Nota/Tarefa).

### Fase 4: Refinamento
1.  Filtros Avançados (Data, Responsável, Status).
2.  Integração com WhatsApp (Link direto).
3.  Indicadores visuais de atraso/risco nos cards.
