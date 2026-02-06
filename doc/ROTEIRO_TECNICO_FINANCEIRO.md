# Roteiro Técnico de Implementação - Módulo Financeiro Blindado

Este documento transforma o planejamento conceitual em etapas técnicas de desenvolvimento, garantindo modularidade e segurança (blindagem).

## A Estratégia de Desenvolvimento: "Onion Architecture" (Em Camadas)

Para garantir que o sistema seja **blindado contra erros**, não construiremos tela por tela. Construiremos **camada por camada**, de dentro para fora.

### Por que essa abordagem é a mais indicada?
1.  **Segurança:** A regra de negócio fica isolada da tela. Se mudarmos o design da tela de vendas, o cálculo financeiro continua seguro.
2.  **Testabilidade:** Podemos testar se o cálculo de juros está certo sem precisar abrir o navegador.
3.  **Reaproveitamento:** A mesma lógica de "Calcular Venda" serve para o App do Instrutor e para o Painel Administrativo.

---

## Fases de Implementação

### FASE 1: O Núcleo (Domain Layer) - *Onde as regras moram*
**Objetivo:** Definir as estruturas de dados e regras de validação estritas. Nada entra no banco sem passar por aqui.

1.  **Schemas (Validadores):**
    *   `AcquirerSchema`: Criar validação rigorosa para taxas (não permitir taxas negativas ou > 100%).
    *   `ContractSchema`: Definir regras de planos (duração, validade, dias de acesso).
    *   `TransactionSchema`: O livro-razão imutável.
2.  **Serviço de Cálculo Puro (FinancialMath Service):**
    *   Criar um serviço que **apenas faz contas** (sem banco de dados).
    *   `calculateInstallments(amount, acquirerTable)`: Recebe valor e tabela de taxas, retorna array de parcelas já com descontos líquidos.
    *   *Por que:* Isso evita erros de arredondamento espalhados pelo código.

### FASE 2: A Persistência (Data Layer) - *Transaction-Ready*
**Objetivo:** Garantir que dados complexos sejam salvos de forma atômica (Batch Writes).

1.  **Upgrade no `BaseRepository`:**
    *   Implementar método `runTransaction` ou `batchWrite` genérico.
2.  **Repositórios Específicos:**
    *   `SalesRepository`: Focado em salvar Venda + Recebíveis + Caixa no mesmo lote.
    *   `FinancialRepository`: Para consultas compPGAs de DRE e Fluxo de Caixa.

### FASE 3: Os Orquestradores (Service Layer) - *Quem manda em tudo*
**Objetivo:** Ligar a tela ao banco, garantindo que as regras da Fase 1 sejam cumpridas.

1.  **`AcquirerService` e `ContractService`:** CRUDs com validações de negócio (ex: "Não pode desativar adquirente se tiver venda pendente").
2.  **`SaleOrchestrator` (O cérebro da venda):**
    *   Recebe o carrinho de compras.
    *   Chama `FinancialMath` para conferir totais.
    *   Verifica se o Caixa está aberto.
    *   Monta o Batch de dados.
    *   Envia para `SalesRepository`.

### FASE 4: A Interface (Presentation Layer) - *O que o usuário vê*
**Objetivo:** Tabelas e Formulários amigáveis que consomem a Fase 3.

1.  **Gestão de Cadastros:**
    *   Tela de Adquirentes (foco em UX para facilitar cadastro de taxas).
    *   Tela de Contratos.
2.  **Ponto de Venda (POS):**
    *   Tela de Venda focada em agilidade.
    *   Visualização clara das parcelas e juros *antes* de confirmar.
3.  **Dashboards Financeiros:**
    *   Gráficos consumindo os dados já estruturados.

---

## Ordem de Execução Sugerida (Checklist)

Para começar agora, seguiremos esta ordem lógica (dependências primeiro):

### Passo 1: Configuração Fundamental
- [ ] Criar/Atualizar `src/data/schemas/ContractSchema.js`
- [ ] Atualizar `src/data/schemas/FinancialSchemas.js` (Adquirentes e Transações)
- [ ] Criar `src/services/Financial/FinancialMath.js` (Cérebro matemático)

### Passo 2: Cadastros Básicos (Para popular o sistema)
- [ ] Criar Repositório e Service de **Contratos**
- [ ] Implementar Tela de Gestão de Contratos
- [ ] Criar Repositório e Service de **Adquirentes**
- [ ] Implementar Tela de Gestão de Adquirentes

### Passo 3: O Fluxo Financeiro (Core)
- [ ] Criar Entidade **Conta Bancária** e **Recebíveis**
- [ ] Implementar Lógica de Venda Blindada (Backend/Service)
- [ ] Criar Tela de Nova Venda (ClientNewSale)

### Passo 4: Fechamento do Ciclo
- [ ] Implementar Tela de Caixa (Abertura/Fechamento)
- [ ] Implementar Relatórios e Dashboards

---

## Confirmação da Estratégia
Essa estratégia **Onion** (Cebola) é a mais indicada pois permite que o projeto cresça indefinidamente sem que um módulo quebre o outro. Se aprovado, iniciaremos imediatamente pelo **Passo 1**.
