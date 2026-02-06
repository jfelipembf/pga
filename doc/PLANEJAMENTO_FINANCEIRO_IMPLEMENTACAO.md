# Planejamento de Implementação - Módulo Financeiro Blindado

Este documento detalha o plano prático para construção do módulo financeiro, focando na integridade dos dados, fluxo correto de informações e prevenção de falhas operacionais.

## 1. Estrutura das Entidades (A Base)

Para que o sistema funcione como um relógio, precisamos definir as peças fundamentais antes de tentar encaixá-las.

### A. Contratos (Produtos Vendáveis)
*O que define:* As regras do jogo com o aluno.
*   **Campos Críticos:**
    *   `valor_total`: Quanto custa.
    *   `max_parcelas`: Limite para evitar prejuízo com taxas.
    *   `duracao_meses`: Para calcular renovação e churn.
    *   `multa_cancelamento`: Regra de negócio automatizada.
*   **Blindagem:** Não permitir edição de valor em contratos que já possuem vendas vinculadas. Se o preço mudar, cria-se uma nova versão/plano.

### B. Adquirentes (As Maquininhas)
*O que define:* O custo do dinheiro.
*   **Campos Críticos:**
    *   `taxa_debito`: % descontado na hora.
    *   `taxas_credito_parcelado`: Tabela (ex: 1x=3%, 2x-6x=4%, 7x-12x=5%).
    *   `dias_recebimento`: Quando o dinheiro cai (D+1, D+30).
*   **Importante:** O sistema precisa saber exatamente qual adquirente foi usada em cada venda para calcular o **Líquido Recebido** real.

---

## 2. O Processo de Venda (O Momento da Verdade)

Aqui é onde a maior parte dos erros acontece (venda sem caixa aberto, valores errados, parcelas perdidas).

### Fluxo da Venda "Blindada":

1.  **Check-in de Caixa:** O sistema **bloqueia** a venda se não houver um caixa aberto pelo usuário atual.
2.  **Seleção do Contrato:** O operador seleciona o plano. O sistema puxa os valores padrão (evita digitação manual de preços).
3.  **Checkout (Pagamento):**
    *   O sistema suporta **Multi-meios** (ex: R$ 100 no Pix + R$ 200 no Cartão).
    *   **Respondendo sua dúvida:**
        *   **Cenário A (Parcelado no Cartão):** O cliente passa o cartão em 10x. O risco é do Banco. Contabilmente, você tem um **Recebível da Adquirente**. O aluno está "quite" com a academia.
        *   **Cenário B (Parcelado no "Boleto/Promissória" - Valor Restante):** O cliente paga R$ 100 hoje e promete R$ 100 mês que vem. O risco é da Academia. Contabilmente, você tem um **Recebível do Cliente**. O aluno **NÃO** está quite.
    *   *Decisão de Projeto:* O sistema deve diferenciar visualmente essas dívidas. Dívida de cartão é "Verde" (dinheiro garantido), Dívida de aluno é "Amarela" (risco de inadimplência).

---

## 3. Automação e Fluxo de Dados

Ao clicar em "Finalizar Venda", o sistema deve disparar uma **Transação Atômica** (tudo ou nada) que realiza 5 ações simultâneas:

1.  **Gera a Venda (Sale):** Registro histórico imutável (quem, quando, o quê).
2.  **Gera os Recebíveis (Receivables):**
    *   Se foi Cartão 10x -> Gera 10 registros de recebíveis futuros atrelados à Adquirente (já descontando as taxas).
    *   Se foi "Fiado" -> Gera registros de recebíveis atrelados ao Cliente.
3.  **Movimenta o Caixa (CashierEntry):**
    *   Entra apenas o valor **pago no ato** (Pix, Dinheiro, Débito).
    *   Valores futuros **não** somam no saldo do caixa de hoje.
4.  **Ativa a Matrícula (Enrollment):** Cria o vínculo do aluno com o plano, liberando a catraca.
5.  **Baixa de Estoque:** Se houver produtos físicos (camisetas, suplementos).

---

## 4. Blindagem Contra Erros (Estratégias Técnicas)

Como garantir que o operador ou o sistema não quebrem a contabilidade:

1.  **Atomicidade (Firestore Batch):** As 5 ações acima rodam dentro de um `batch`. Se faltar internet no meio, **nada** é salvo. Isso evita o clássico "Gerou a venda mas não gerou o financeiro".
2.  **Validação de Soma (Checksum):** O backend deve validar se `Soma dos Pagamentos == Total da Venda`.
    *   Venda: R$ 300. Pagamento: R$ 100 Pix + R$ 150 Cartão. Erro! Faltam R$ 50. O sistema recusa salvar.
3.  **Logs de Auditoria:** Qualquer alteração sensível (ex: cancelar uma venda, estornar parcela) exige um motivo e fica gravada (quem fez e quando).
4.  **Estado do Caixa:** Não permitir fechar caixa com diferença sem uma justificativa obrigatória.

---

## 5. Visualização (Onde os dados aparecem)

### A. Dashboard Financeiro (Visão Macro)
*   **Faturamento Presumido (Competência):** Total de vendas fechadas no mês.
*   **Entrada Real (Caixa):** Quanto dinheiro de fato entrou na conta.
*   **Previsão de Recebíveis:** Gráfico de quanto vai cair de cartão nos próximos meses.

### B. Gestão de Caixa (Operacional)
*   Focado no dia-a-dia. Lista de Pix, Dinheiro e Cartão do dia.
*   Botões de "Sangria" (retirada para banco) e "Suprimento" (troco).

### C. Relatório de Despesas
*   Cadastro simples: Categoria (Luz, Água), Valor, Data Pagamento.
*   Deve abater do relatório de Fluxo de Caixa Líquido.

### D. Relatório de Inadimplência
*   Lista automática de todos os "Recebíveis de Cliente" (Cenário B) atrasados.
*   Botão de cobrança via WhatsApp integrado.

---

## 6. Gestão de Cancelamentos e Regime Híbrido

### A. O Regime Híbrido no Código
Sim, usaremos o modelo híbrido. Isso não complica o planejamento, apenas exige **duas datas** obrigatórias em cada movimentação financeira.
*   `data_movimento` (Competência): Quando o contrato foi assinado.
*   `data_pagamento` (Caixa): Quando o dinheiro caiu (ou vai cair) na conta.

**Impacto Prático:**
Ao gerar um relatório, o usuário terá um *toggle* (botão de alternância):
*   [Modo Competência]: Mostra R$ 1.200,00 de Vendas em Janeiro (mesmo que parcelado em 12x).
*   [Modo Caixa]: Mostra R$ 100,00 recebidos em Janeiro + R$ 100,00 em Fevereiro...

### B. Lógica de Cancelamento e Estorno
Cancelar um contrato não apaga o histórico. O fluxo contabilmente correto para o sistema é:

1.  **Cálculo do Saldo:**
    *   (Valor Total do Contrato) - (Aulas Utilizadas) = **Saldo a Devolver**.
2.  **Aplicação da Multa:**
    *   (Saldo a Devolver) - (Multa Contratual) = **Valor Líquido do Reembolso**.

#### Como isso entra no sistema:
1.  **Multa:** É registrada como uma **Nova Receita** (Categoria: Multas e Juros). Isso é lucro da academia.
2.  **Parcelas Futuras (Cartão):** São marcadas como `canceladas` no sistema e o ADM deve estornar na maquininha.
3.  **Valor já pago (Reembolso):** É registrado como uma **Despesa/Saída** (Categoria: Estornos/Devoluções).

**Exemplo Prático:**
> Aluno pagou R$ 1.000 à vista. Usou R$ 200. Cancelou. Multa de 10% (R$ 100).
> *   Devolução Calculada: R$ 800.
> *   Multa retida: R$ 100.
> *   Reembolso Final ao Aluno: R$ 700.

**No Banco de Dados:**
*   Venda Original: +R$ 1.000 (Mantida).
*   Receita de Multa: +R$ 100 (Nova transação).
*   Despesa de Estorno: -R$ 700 (Nova transação).
*   **Saldo Final:** R$ 400 (R$ 200 uso + R$ 100 multa + R$ 100 "lucro retido" de taxas não reembolsáveis).

---

## 7. O Ponto Cego: Antecipação de Recebíveis

Existe um ponto avançado que muitas academias usam e que quebra o financeiro se não for previsto: **Antecipação**.

*   **O Cenário:** A academia vende em 10x de R$ 100, mas precisa do dinheiro *hoje*. Ela pede para a Adquirente antecipar tudo.
*   **O Problema Contábil:**
    *   Se o sistema mostrar receber R$ 100 mês que vem, ele estará mentindo (o dinheiro já entrou).
    *   A antecipação gera uma **Taxa Extra** (ex: 2% a mais) que é uma Despesa Financeira grave.

**Solução no Sistema:**
Precisamos de um botão "Registrar Antecipação" no módulo financeiro.
*   Input: Seleciona as parcelas futuras que foram antecipadas.
*   Input: Informa a taxa cobrada.
*   Ação: O sistema traz o dinheiro do futuro para o "Caixa Hoje" e lança a taxa como Despesa Financeira.

Isso é crucial porque sem isso, o **Fluxo de Caixa Projetado** vira uma fantasia.

---

## 8. Bancos e Reconciliação (A Verdade vs. O Sistema)

Para garantir que o dinheiro computado no sistema está realmente no banco, precisamos de um módulo de **Contas Bancárias**.

### A. Entidade "Conta Bancária" (Bank Account)
Precisamos saber onde o dinheiro está.
*   Cadastros típicos: "Itaú", "Santander", "Cofre (Caixa Físico)".
*   **Fluxo de "Sangria" (Digital):**
    *   Quando a Adquirente paga as vendas de cartão, o dinheiro não vai para o caixa físico da recepção, ele vai direto para o Banco.
    *   O sistema deve baixar o recebível e criar um lançamento de entrada na conta "Itaú".

### B. O Processo de Reconciliação (Check-match)
É o ato de conferir se o sistema bate com a realidade.

*   **Nível Desejável (Automático):** API de Open Finance (Baixa o extrato real e o sistema tenta adivinhar: "Esse depósito de R$ 100 parece ser a Mensalidade do João").
*   **Nível MVP (Manual):** Importação de arquivo OFX.
    1.  O usuário sobe o OFX do banco.
    2.  O sistema exibe lado a lado: [Linha do Extrato] vs [Possíveis Lançamentos do Sistema].
    3.  O usuário clica em "Conciliar" (Dar match).
    4.  **O Pulo do Gato:** Se sobrar linha no extrato que não tem no sistema (ex: Tarifa Bancária), o sistema oferece um botão "Criar Despesa" ali mesmo.

**Por que isso é vital?**
Sem reconciliação, o dono da academia pode ter R$ 50.000 "teóricos" no sistema, mas só R$ 40.000 reais no banco (roubo, taxas escondidas, erros). A reconciliação é a única prova real.

---

## Próximos Passos (Plano de Ação)

1.  Configurar **Schemas de Adquirentes e Contratos** (Garantir que suportam taxas compPGAs).
2.  Criar a lógica de **Cálculo de Parcelas** (Input: Valor + Adquirente -> Output: Valor Líquido por parcela).
3.  Implementar a **Tela de Venda (POS)** com suporte a multi-pagamento.
4.  Implementar o **Backend de Transação** (Batch Write).
5.  Implementar módulo de **Contas Bancárias** e Fluxo de Transferência (Sangria).
