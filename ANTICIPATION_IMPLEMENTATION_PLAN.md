# Plano de Implementação: Gestão de Antecipação de Recebíveis

Este plano cobre dois cenários:
1.  **Antecipação Automática (Configurada na Adquirente):** Venda já nasce antecipada (Plano D+1).
2.  **Antecipação Manual (Spot):** Venda normal (30/60/90) que é antecipada posteriormente.

---

## 1. Comportamento do Sistema com Antecipação Automática (D+1)

Se a Adquirente estiver configurada com `settlementDays: 1` (D+1) e taxas de antecipação (ex: 9.45%):

### A. Gestão de Parcelas (`SalesPaymentProcessor.js`)
*   **O sistema ainda gera 12 parcelas?**
    *   **SIM.** Continuaremos gerando 12 registros de recebíveis.
    *   **Por que?** Para manter o vínculo com a venda parcelada do cliente, permitir estornos parciais e conciliação detalhada (caso o repasse bancário venha quebrado).
*   **O que muda?**
    *   **Vencimento (`dueDate`):** Em vez de 30/60/90 dias, **TODAS** as 12 parcelas terão vencimento para **D+1** (Dia seguinte).
    *   **Status:** Nascem "Abertas" (Open), mas vencem quase imediatamente.

### B. Contabilidade e DRE (`LedgerService.js`)
Para que o DRE mostre a realidade (quanto foi taxa de cartão e quanto foi juros), precisamos de um refinamento no cadastro da Adquirente:

*   **Taxa Total (Aplicada):** 9.45% (O que o sistema desconta do valor líquido).
*   **Taxa Base (MDR - Opcional):** 1.91% (O custo se não houvesse antecipação).
*   **Cálculo Automático:**
    *   `Taxa Cartão` = 1.91%
    *   `Despesa Financeira` = 7.54% (9.45% - 1.91%)

**Se não configurarmos a Taxa Base separada:** O sistema lançará tudo (9.45%) como "Taxa de Cartão" (Despesa Operacional). O resultado líquido (R$) é o mesmo, mas a categorização no DRE fica menos precisa.

### C. Fluxo de Baixa (`autoSettleReceivables.js`)
*   A rotina automática rodará às 04:00 do dia D+1.
*   Encontrará as 12 parcelas vencidas.
*   Dará baixa em todas de uma vez, lançando o valor líquido somado no Banco e as despesas respectivas.

---

## 2. Checklist de Ações Necessárias

### Fase 1: Configuração da Adquirente "Inteligente"
- [ ] **Schema de Adquirente (`AcquirerSchema.js`):**
    - Adicionar campo `standardFees` (Taxas Padrão/Base) além do `fees` (Taxas Atuais/Aplicadas).
    - Isso permitirá ao sistema calcular o "Spread" (Juros) da antecipação automaticamente.

### Fase 2: Processamento da Venda (`SalesPaymentProcessor.js`)
- [ ] Ajustar lógica de cálculo de `dueDate`:
    - Se `adquirente.anticipationMode == 'auto'` ou `settlementDays == 1`:
        - Forçar `dueDate = hoje + 1 dia` para todas as parcelas.
- [ ] Ajustar cálculo de taxas:
    - Calcular `feeAmount` (Taxa Total).
    - Calcular `financialFeeAmount` (Diferença entre Taxa Total e Taxa Base, se existir).
    - Salvar esses valores separados no registro do Recebível.

### Fase 3: Contabilidade (`LedgerService.js`)
- [ ] Criar conta contábil: `FINANCIAL_EXPENSES_ANTICIPATION = '2.5.5'`.
- [ ] Atualizar `createCardFeeProvisionEntry` (na Venda):
    - Lançar: D: Despesa Financeira (pelo `financialFeeAmount`).

---

## 3. Resumo do Fluxo Financeiro (Exemplo: R$ 1.000,00 em 12x)

### Situação 1: Sem Antecipação (Padrão)
- **Parcelas:** 12 recebíveis (30, 60... 360 dias).
- **Taxa:** 1.91% (R$ 19,10).
- **Líquido:** R$ 980,90 (recebido ao longo de um ano).

### Situação 2: Antecipação Automática D+1 (Novo Fluxo)
- **Parcelas:** 12 recebíveis (Todos vencendo Amanhã).
- **Taxa Total:** 9.45% (R$ 94,50).
- **Líquido:** R$ 905,50 (recebido amanhã).
- **Contabilidade (Se separar taxas):**
    - Despesa Cartão: R$ 19,10.
    - Despesa Juros: R$ 75,40.

**Conclusão:** O sistema continuará gerindo as parcelas individualmente para segurança e controle, mas financeiramente elas se comportarão como um recebimento à vista com custo elevado.
