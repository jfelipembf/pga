# ⏰ Cronograma de Triggers Agendados

Todos os triggers rodam após meia-noite (timezone: America/Sao_Paulo) com intervalos de 15 minutos para evitar sobrecarga.

## 📅 Horário de Execução

| Horário | Trigger | Descrição |
|---------|---------|-----------|
| **00:00** | `autoAttendanceTrigger` | Registra presença automática para matrículas do dia anterior |
| **00:10** | `ensureSessionsHorizon` | Garante sessões criadas para os próximos 6 meses |
| **00:25** | `processExpiredContracts` | Finaliza contratos que atingiram a data de término |
| **00:40** | `processInactiveContracts` | Processa contratos inativos |
| **00:55** | `processScheduledSuspensions` | Inicia suspensões agendadas |
| **01:10** | `processSuspensionEnds` | Finaliza suspensões que terminaram |
| **01:25** | `processScheduledCancellations` | Processa cancelamentos agendados |
| **01:40** | `processContractDefaultCancellation` | Cancela contratos por inadimplência |
| **01:55** | `checkExpiringContracts` | Notifica contratos próximos do vencimento |
| **02:10** | `checkBirthdayAutomations` | Envia mensagens de aniversário |
| **02:25** | `checkExperimentalClassAutomations` | Processa automações de aulas experimentais |
| **02:40** | `processRecurringTasks` | Processa tarefas recorrentes |
| **02:55** | `autoCloseCashier` | Fecha caixas automaticamente |

## 🔄 Ordem de Prioridade

Os triggers foram organizados na seguinte ordem lógica:

1. **Presença** (00:00) - Primeiro, registra presenças do dia anterior
2. **Sessões** (00:10) - Garante que existam sessões futuras
3. **Contratos** (00:25-01:40) - Processa lifecycle de contratos
4. **Notificações** (01:55-02:25) - Envia notificações e automações
5. **Limpeza** (02:40-02:55) - Tarefas de manutenção e fechamento

## ⚙️ Configuração

Todos os triggers usam:
- **Região**: `us-central1`
- **Timezone**: `America/Sao_Paulo` (UTC-3)
- **Formato Cron**: `"minuto hora * * *"` (diário)

## 📝 Notas

- Intervalos de 15 minutos evitam sobrecarga do sistema
- Triggers rodam após meia-noite para processar dados do dia anterior
- Ordem otimizada para dependências entre processos
- Logs detalhados em cada execução para monitoramento

## 🔧 Manutenção

Para alterar horários, edite o arquivo correspondente em:
```
apps/app/functions/src/triggers/<nome-do-trigger>.js
```

Ou execute o script de atualização:
```bash
bash apps/app/functions/src/triggers/update-schedules.sh
```
