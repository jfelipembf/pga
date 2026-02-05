import { workflowRepository } from "../../data/repositories/Automation/WorkflowRepository";
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
        console.log(`[Automation] Trigger fired: ${trigger}`, contextData);

        try {
            // 1. Buscar workflows configurados para este gatilho
            const workflows = await workflowRepository.findActiveByTrigger(tenantId, trigger);

            if (!workflows || workflows.length === 0) {
                console.log(`[Automation] No active workflows for trigger: ${trigger}`);
                return;
            }

            console.log(`[Automation] Found ${workflows.length} workflows. Processing...`);

            // 2. Executar cada workflow
            const promises = workflows.map(workflow => this._executeWorkflow(tenantId, workflow, contextData));

            // "Fire and forget" ou await dependendo da necessidade. Aqui vamos aguardar para logar erros.
            const results = await Promise.allSettled(promises);

            results.forEach((res, idx) => {
                if (res.status === 'rejected') {
                    console.error(`[Automation] Workflow ${workflows[idx].name} failed:`, res.reason);
                } else {
                    console.log(`[Automation] Workflow ${workflows[idx].name} executed successfully.`);
                }
            });

        } catch (error) {
            console.error('[Automation] Critical error processing trigger:', error);
        }
    }

    async _executeWorkflow(tenantId, workflow, contextData) {
        let messageContent = workflow.channelConfig.template;

        // 3. Gerar conteúdo com IA se habilitado
        if (workflow.aiConfig && workflow.aiConfig.enabled) {
            console.log(`[Automation] Generating AI content for workflow: ${workflow.name}`);

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
        const targetPhone = contextData.phone || contextData.mobile || contextData.responsavelPhone;

        if (!targetPhone) {
            throw new Error(`Target phone not found in context data for workflow ${workflow.name}`);
        }

        if (workflow.channelConfig.channel === 'whatsapp') {
            console.log(`[Automation] Sending WhatsApp to ${targetPhone}...`);
            await messagingService.sendText(tenantId, targetPhone, messageContent);
        }
    }

    _replaceVariables(template, data) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return typeof data[key] !== 'undefined' ? data[key] : match;
        });
    }
}

export const automationService = new AutomationService();
