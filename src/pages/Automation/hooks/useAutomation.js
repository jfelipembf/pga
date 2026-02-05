import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../../../hooks/useTenant';
import { workflowRepository } from '../../../data/repositories/Automation/WorkflowRepository';
import { toast } from 'react-toastify';

export const useAutomation = () => {
    const { idTenant, idBranch } = useTenant();
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Configurações de Integração (Credenciais)
    const [integrationConfig, setIntegrationConfig] = useState(null);

    const loadData = useCallback(async () => {
        if (!idTenant) return;
        setLoading(true);
        try {
            // Buscar Workflows
            // const flows = await workflowRepository.findAll(idTenant) || [];

            // Mock para dev enquanto back não retorna tudo
            const flows = [
                {
                    id: '1',
                    name: 'Parabéns pela Aprovação',
                    trigger: 'EVALUATION_APPROVED',
                    isActive: true,
                    channelConfig: { channel: 'whatsapp', template: "Parabéns {studentName}..." },
                    aiConfig: { enabled: true, provider: 'openai', promptTemplate: "Crie..." },
                },
                {
                    id: '2',
                    name: 'Lembrete Experimental',
                    trigger: 'TRIAL_CLASS_SCHEDULED',
                    isActive: true,
                    channelConfig: { channel: 'whatsapp', template: "Confirmado..." },
                    aiConfig: { enabled: false },
                }
            ];
            setWorkflows(flows);

            // Carregar IntegrationConfig
            // const config = await integrationRepo.get(idTenant);
            // setIntegrationConfig(config);

        } catch (error) {
            console.error("Erro ao carregar automações:", error);
            toast.error("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    }, [idTenant]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const saveWorkflow = async (data) => {
        setSaving(true);
        try {
            if (data.id) {
                // await workflowRepository.update(idTenant, null, data.id, data);
                // Mock update
                setWorkflows(prev => prev.map(w => w.id === data.id ? { ...w, ...data } : w));
            } else {
                // await workflowRepository.create(idTenant, null, data);
                // Mock create
                setWorkflows(prev => [...prev, { ...data, id: String(Date.now()) }]);
            }
            toast.success("Automação salva com sucesso!");
            return true;
        } catch (error) {
            toast.error("Erro ao salvar automação");
            console.error(error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const deleteWorkflow = async (id) => {
        if (!confirm("Tem certeza?")) return;
        // ... implementation
        setWorkflows(prev => prev.filter(w => w.id !== id));
        return true;
    };

    const saveIntegrations = async (config) => {
        // Salvar credenciais
        setSaving(true);
        try {
            console.log("Saving integration config:", config);
            // await integrationRepo.save(idTenant, config);
            setIntegrationConfig(config);
            toast.success("Credenciais atualizadas!");
            return true;
        } catch (e) {
            toast.error("Erro ao salvar credenciais");
            return false;
        } finally {
            setSaving(false);
        }
    };

    return {
        workflows,
        integrationConfig,
        loading,
        saving,
        saveWorkflow,
        deleteWorkflow,
        saveIntegrations,
        refresh: loadData
    };
};
