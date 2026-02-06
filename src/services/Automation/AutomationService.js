import { integrationRepository } from "../../data/repositories/Automation/IntegrationRepository";
import { DEFAULT_MESSAGES } from "../../pages/Automation/config/triggers";
import { aiService } from "./AIService";
import { messagingService } from "./MessagingService";

/**
 * Orquestrador principal de automações
 */
class AutomationService {

    /**
     * Dispara um gatilho de automação
     * @param {string} tenantId - Tenant ID
     * @param {string} trigger - Nome do gatilho (ex: 'EVALUATION_APPROVED')
     * @param {object} contextData - Dados do evento (ex: { studentName: 'João', level: 'Nível 1', phone: '55...' })
     */
    async emit(tenantId, trigger, contextData) {


        try {
            // 1. Carregar configurações do Tenant
            const settings = await integrationRepository.getSettings(tenantId);

            // 2. Verificar se o gatilho está ativo
            // Default é true ( !== false ) para manter compatibilidade, ou false?
            // User asked for a switch to inform active/not active. default should probably be checked in settings.
            const isActive = settings?.activeTriggers?.[trigger] !== false;

            if (!isActive) {

                return;
            }

            // 3. Obter Template (Customizado ou Default)
            const template = settings?.messageTemplates?.[trigger] || DEFAULT_MESSAGES[trigger];

            if (!template) {
                console.warn(`[Automation] No template found for trigger: ${trigger}`);
                return;
            }

            // 4. Montar objeto "Workflow" temporário para reutilizar lógica existente
            // (Futuramente podemos migrar totalmente para workflows dinâmicos)
            const pseudoWorkflow = {
                name: trigger,
                channelConfig: {
                    channel: 'whatsapp',
                    template: template
                },
                aiConfig: { enabled: false } // IA desabilitada por padrão neste fluxo simples
            };

            // Passar settings (config customizada) para o message service (ex: Token da Evolution API)
            // A assinatura do _executeWorkflow e messageService.sendText precisa suportar passar config customizada
            await this._executeWorkflow(tenantId, pseudoWorkflow, contextData, settings);

        } catch (error) {
            console.error('[Automation] Critical error processing trigger:', error);
        }
    }

    async _executeWorkflow(tenantId, workflow, contextData, customSettings = null) {
        let messageContent = workflow.channelConfig.template;

        // 3. Gerar conteúdo com IA se habilitado
        if (workflow.aiConfig && workflow.aiConfig.enabled) {


            const aiOutput = await aiService.generateText(
                workflow.aiConfig.promptTemplate,
                contextData
            );

            // Injetar saída da IA no template (ex: substitui {ai_output})
            // Se o template não tiver {ai_output}, anexa ao final por padrão
            if (messageContent.includes('{ai_output}')) {
                messageContent = messageContent.replace('{ai_output}', aiOutput || '');
            } else {
                messageContent = `${messageContent}\n\n${aiOutput || ''}`;
            }
        }

        // 4. Substituir variáveis do template (ex: {studentName})
        messageContent = this._replaceVariables(messageContent, contextData);

        // 5. Enviar mensagem
        const targetPhone = contextData.phone || contextData.mobile || contextData.cellPhone || contextData.responsavelPhone;

        if (!targetPhone) {
            console.warn(`[Automation] Target phone not found in context data for workflow ${workflow.name}`, contextData);
            return;
        }

        if (workflow.channelConfig.channel === 'whatsapp') {
            try {

                await messagingService.sendText(tenantId, targetPhone, messageContent, customSettings);
            } catch (err) {
                console.error(`[Automation] Error sending WhatsApp:`, err);
            }
        }
    }

    _replaceVariables(template, data) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return typeof data[key] !== 'undefined' ? data[key] : match;
        });
    }
}

export const automationService = new AutomationService();
