# Implementação do Conceito Contábil e de Vendas

Este documento detalha como o sistema processará as vendas realizadas no **Ponto de Venda (SalesPoint)**, garantindo a integridade contábil e a rastreabilidade financeira total (Audit Trail).

---

## 1. O Fluxo da Operação

A venda é dividida em dois momentos simultâneos no ato do fechamento:

### A. Reconhecimento da Receita (Regime de Competência)
*   **O que é:** O registro de que a empresa "gerou valor" (vendeu um contrato/produto).
*   **Ação:** Ao selecionar itens no carrinho, o sistema soma o valor bruto.
*   **Contábil:** 
    *   **Crédito:** Conta de Receita (ex: Venda de Planos).
    *   **Débito:** Ativo Circulante (Contas a Receber do Cliente).

### B. Liquidação Financeira (Regime de Caixa)
*   **O que é:** O registro de como esse valor será recebido.
*   **Ação:** O usuário adiciona uma ou mais formas de pagamento que totalizam o valor dos itens.
*   **Contábil:**
    *   **Crédito:** Ativo Circulante (Contas a Receber do Cliente) - *Aqui a dívida do cliente é "baixada"*.
    *   **Débito:** Conta de Destino (Caixa Físico, Banco ou Adquirente de Cartão).

---

## 2. O que cada Página fará

### Ponto de Venda (`SalesPoint`)
*   **Seleção de Itens:** Identifica **o que** está saindo do estoque ou qual serviço/contrato está sendo ativado.
*   **Seleção de Pagamentos:** Identifica **por onde** o dinheiro entrará.
*   **Validação:** Impede a finalização se o total de pagamentos for menor que o total de itens.
*   **Ação Final:** Dispara um comando para criar o objeto `Sale` no banco de dados.

### Caixa (`CashierPage`)
*   **Acompanhamento:** Exibe as vendas em tempo real conforme entram no caixa atual.
*   **Dinheiro Físico:** Incrementa o saldo do "Fundo de Gaveta".
*   **Fechamento:** Permite conferir se o valor físico bate com o registrado no sistema (Reconciliação).

---

## 3. Dados que serão salvos (Esquema de Dados)

Ao clicar em "Finalizar Venda", os seguintes dados serão persistidos:

### Objeto `Sale` (Venda)
```json
{
  "id": "SALE_123",
  "client_id": "CLIENT_456",
  "seller_id": "STAFF_789",
  "date": "2024-01-31T07:30:00Z",
  "total_bruto": 1200.00,
  "total_desconto": 200.00,
  "total_liquido": 1000.00,
  "status": "COMPLETED",
  "items": [
    { "type": "CONTRACT", "id": "PLAN_ANNUAL", "name": "Plano Anual", "value": 1000.00 }
  ],
  "payments": [
    { 
      "method": "pix", 
      "value": 500.00, 
      "status": "CONFIRMED",
      "destination": "BANK_ACCOUNT_ID" 
    },
    { 
      "method": "credit_card", 
      "value": 500.00, 
      "installments": 10,
      "acquirer": "STONE",
      "auth_code": "123456",
      "status": "PENDING_SETTLEMENT" 
    }
  ]
}
```

---

## 4. Processamento dos Dados (Backend/Cloud Functions)

Ao salvar a `Sale`, um gatilho processará as seguintes sub-tarefas:

1.  **Atualização de Contrato:** Se houver um item do tipo "Contrato", o perfil do cliente é atualizado com a nova vigência e status "Ativo".
2.  **Movimentação do Razão (Ledger):**
    *   Cria um lançamento de Crédito na conta de **Receita**.
    *   Cria um lançamento de Débito na conta de **Contas a Receber**.
3.  **Lançamento no Fluxo de Caixa:**
    *   Para pagamentos em **Dinheiro/Pix**: Cria um lançamento de entrada imediata na `CashierSession` ou conta bancária.
    *   Para pagamentos em **Cartão**: Cria uma `Transaction` (Transação de Cartão) que passará pelo processo de conciliação de taxas da adquirente antes de virar saldo disponível.
4.  **Audit Trail:** Registra no log de auditoria quem realizou a venda e em qual terminal/IP.

---

## 5. Por que fazemos assim?

*   **Auditabilidade:** Se o dono da academia perguntar: "Por que entrou R$ 500 no Pix?", o sistema aponta para a `SALE_123` do cliente `X`.
*   **Multimeios:** Permite que o cliente pague com 2 cartões e um pouco de dinheiro, algo comum em vendas de alto valor (como planos anuais).
*   **Gestão de Inadimplência:** Se o sistema registrar a venda mas o pagamento em cartão for cancelado (Chargeback), a venda continua existindo, mas o financeiro mostra o "buraco" no recebimento.

---

**Próximo Passo:** Implementar o Repository de Vendas (`SalesRepository.js`) para salvar essa estrutura no Firestore seguindo as regras acima.
