# Planejamento: Módulo de Automação Integrada (IA + Mensageria)

## 1. Visão Geral
O objetivo é transformar o sistema em uma plataforma ativa que trabalha pelo usuário, utilizando IA (OpenAI/Gemini) para gerar conteúdo inteligente e Evolution API para entregar esse conteúdo via WhatsApp de forma automatizada.

## 2. Pontos de Automação Estratégicos

### A. Pedagógico (Avaliações & Aulas)
- **Feedback de Avaliação**: Ao aprovar um aluno, a IA gera um texto parabenizando e destacando os pontos fortes (baseado nos critérios "Aprovado"), e envia para o WhatsApp dos pais.
- **Diário de Bordo**: Resumo semanal do progresso do aluno enviado automaticamente.
- **Alerta de Frequência**: Mensagem de "Sentimos sua falta" (com tom preocupado/acolhedor) após 2 faltas consecutivas sem justificativa.

### B. Financeiro (Cobrança Inteligente)
- **Pré-Vencimento**: Lembrete amigável 2 dias antes.
- **Pós-Vencimento (Régua de Cobrança)**:
    - Dia +1: "Esquecimento?" (Tom leve)
    - Dia +5: "Regularização" (Tom formal)
    - Dia +15: Negociação (AI Chatbot simples para oferecer link de pagamento).
- **Confirmação**: Envio imediato do recibo após baixa no sistema.

### C. Comercial (Matrículas)
- **Follow-up Experimental**: 2 horas após a aula experimental, enviar mensagem: "Joãozinho gostou da aula? Vamos garantir a vaga?".
- **Agendamento**: Confirmação da aula experimental com localização e dicas ("Traga touca e óculos").
- **Aniversários**: Mensagem gerada por IA, personalizada com o nome e idade.

## 3. Arquitetura Técnica (Modular e Escalável)

A arquitetura será dividida em **Provedores (Providers)**, **Fluxos (Workflows)** e **Gatilhos (Triggers)**.

### Estrutura de Pastas Proposta
```
src/
  services/
    Automation/
      AIService.js            # Adapter para OpenAI/Gemini
      MessagingService.js     # Adapter para Evolution API
      WorkflowService.js      # Gerenciador de Regras
      AutomationService.js    # Fachada principal
  data/
    repositories/
      Automation/
        WorkflowRepository.js # Salva as configurações das automações
        LogRepository.js      # Histórico de envios (sucesso/erro)
    schemas/
      Automation/
        WorkflowSchema.js     # Definição da regra (Trigger -> Action)
        IntegrationConfig.js  # Configuração das APIs (Keys, URLs)
```

### Modelo de Dados (WorkflowSchema)
```javascript
{
  id: "evt_avaliacao_concluida",
  name: "Enviar Feedback de Avaliação",
  trigger: "EVALUATION_APPROVED", // Gatilho do sistema
  isActive: true,
  aiConfig: {
    enabled: true,
    provider: "openai", // ou gemini
    promptTemplate: "Crie uma mensagem curta parabenizando {student_name} pela aprovação no nível {level_name}...", 
    context: ["student_history", "level_details"] // Dados a injetar no prompt
  },
  channelConfig: {
    channel: "whatsapp",
    template: "Olá {responsavel}, {ai_generated_message}", // Mescla texto fixo com IA
    delayMinutes: 0 // Envio imediato
  }
}
```

## 4. UX/UI: A Experiência do Usuário

Não faremos apenas uma "tela de configuração técnica". Faremos um **Assistente de Automação**.

### A. Tela: "Central de Inteligência" (Automation Hub)
- **Cards Visuais**: Cada automação é um card (ex: "Robô de Cobrança", "Assistente Pedagógico").
- **Toggle Simples**: Ligar/Desligar automação.
- **Log de Atividades**: "Hoje: Enviou 15 mensagens de aniversário, 3 cobranças".

### B. Micro-interações nas Telas Existentes
- **Avaliação**: Ao clicar em "Salvar e Finalizar", um modal pergunta: *"Deseja que a IA escreva e envie o feedback para o pai agora?"* (Com preview editável).
- **Grade**: Botão no agendamento experimental: *"Enviar confirmação via WhatsApp"* (Um clique).

## 5. Próximos Passos (Plano de Execução)

1. **Infraestrutura Base**: Criar Schemas e Services de Integração.
2. **Integração AI**: Implementar `AIService` (conectar com OpenAI/Gemini).
3. **Integração WhatsApp**: Implementar `MessagingService` (Evolution API).
4. **Primeiro Caso de Uso**: Automatizar o envio de confirmação de Aula Experimental (Simples e alto valor).
5. **Segundo Caso de Uso**: Feedback de Avaliação com IA (Complexidade média, alto valor pedagógico).
