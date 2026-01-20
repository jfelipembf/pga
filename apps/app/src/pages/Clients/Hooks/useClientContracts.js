import { useState, useMemo, useEffect } from "react"
import { useLoading } from "../../../hooks/useLoading"
import { useToast } from "../../../components/Common/ToastProvider"
import {
    scheduleContractSuspension,
    listContractSuspensions,
    stopContractSuspension,
    cancelClientContract,
} from "../../../services/ClientContracts"
import { buildContractKey } from "../Utils/contractsUtils"

export const useClientContracts = (contracts, idClient, clientName, onRefresh) => {
    const [selectedId, setSelectedId] = useState(() => {
        if (contracts.length > 0) {
            return buildContractKey(contracts[0], 0)
        }
        return null
    })
    const [activeAction, setActiveAction] = useState("Dados")
    const [adjustAddForm, setAdjustAddForm] = useState({ days: "", reason: "" })
    const [adjustDebitForm, setAdjustDebitForm] = useState({ days: "", reason: "" })
    const [cancelForm, setCancelForm] = useState({
        mode: "now",
        date: "",
        reason: "",
        cancelOpenReceivables: false,
        cancelFutureSessions: false,
        generateCredit: false,
        creditAmount: "",
        applyFine: false,
        fineAmount: ""
    })
    const [transferForm, setTransferForm] = useState({ target: "", note: "" })
    const [suspendForm, setSuspendForm] = useState({
        start: "",
        end: "",
        reason: "",
    })
    const [confirmStop, setConfirmStop] = useState({ open: false, idSuspension: null })
    const [suspensions, setSuspensions] = useState([])
    const toast = useToast()
    const { isLoading, withLoading } = useLoading()

    const selectedContract = useMemo(() => {
        const foundIndex = contracts.findIndex((contract, index) => buildContractKey(contract, index) === selectedId)
        return foundIndex !== -1 ? contracts[foundIndex] : contracts[0]
    }, [contracts, selectedId])

    const [selectedOverride, setSelectedOverride] = useState(null)
    const selected = selectedOverride || selectedContract || null

    useEffect(() => {
        setSelectedOverride(null)
    }, [selectedContract?.idContract, selectedContract?.id])

    useEffect(() => {
        const loadSuspensions = async () => {
            if (!selected?.id) {
                setSuspensions([])
                return
            }
            try {
                await withLoading('suspensions', async () => {
                    const list = await listContractSuspensions(selected.id)
                    setSuspensions(list)
                })
            } catch (error) {
                console.error("Erro ao carregar suspensões", error)
                toast.show({ title: "Erro ao carregar suspensões", description: error?.message || String(error), color: "danger" })
            }
        }
        loadSuspensions()
    }, [selected?.id, toast, withLoading])

    const handleSuspend = async (e) => {
        e?.preventDefault()
        if (!selected?.id) return
        try {
            await withLoading('suspend', async () => {
                const response = await scheduleContractSuspension({
                    idClientContract: selected.id,
                    idClient, // Added
                    clientName, // Added
                    startDate: suspendForm.start,
                    endDate: suspendForm.end,
                    reason: suspendForm.reason,
                    createdBy: null,
                })
                toast.show({ title: "Suspensão registrada", color: "success" })
                setSuspendForm({ start: "", end: "", reason: "" })
                const isImmediate = response.status === "active"
                const daysUsed = Number(response.daysUsed || 0)
                setSelectedOverride(prevSelected => {
                    const base = prevSelected || selected || {}
                    return {
                        ...base,
                        status: isImmediate ? "suspended" : base.status,
                        endDate: isImmediate && response.newEndDate ? response.newEndDate : base.endDate,
                        totalSuspendedDays: isImmediate
                            ? Number(base.totalSuspendedDays || 0) + daysUsed
                            : Number(base.totalSuspendedDays || 0),
                        pendingSuspensionDays: !isImmediate
                            ? Number(base.pendingSuspensionDays || 0) + daysUsed
                            : Number(base.pendingSuspensionDays || 0),
                    }
                })
                setSuspensions(prev => [
                    {
                        id: response.id,
                        startDate: response.startDate,
                        endDate: response.endDate,
                        reason: response.reason,
                        status: response.status,
                        daysUsed: response.daysUsed,
                        newEndDate: response.newEndDate || null,
                    },
                    ...prev,
                ])
                onRefresh?.()
            })
        } catch (error) {
            console.error("Erro ao suspender contrato", error)
            toast.show({ title: "Erro ao suspender", description: error?.message || String(error), color: "danger" })
        }
    }

    const handleStopSuspension = async (idSuspension) => {
        if (!selected?.id || !idSuspension) return
        try {
            await withLoading('stop-suspension', async () => {
                const response = await stopContractSuspension({
                    idClientContract: selected.id,
                    idClient, // Added
                    clientName, // Added
                    idSuspension
                })

                toast.show({ title: response.type === "active_stopped" ? "Suspensão interrompida" : "Agendamento cancelado", color: "success" })

                // Atualizar contrato
                if (response.type === "active_stopped") {
                    setSelectedOverride(prev => ({
                        ...prev || selected,
                        status: "active",
                        endDate: response.newContractEndDate,
                        totalSuspendedDays: (Number(prev?.totalSuspendedDays || selected?.totalSuspendedDays || 0) - (response.unusedDays || 0))
                    }))
                } else {
                    // Se cancelou agendamento, apenas remove do pending
                    setSelectedOverride(prev => ({
                        ...prev || selected,
                        pendingSuspensionDays: Math.max(0, (Number(prev?.pendingSuspensionDays || selected?.pendingSuspensionDays || 0) - (response.unusedDays || 0)))
                    }))
                }

                // Atualizar lista de suspensões
                setSuspensions(prev => prev.map(s => s.id === idSuspension ? {
                    ...s,
                    status: response.type === "active_stopped" ? "stopped" : "cancelled",
                    endDate: response.type === "active_stopped"
                        ? new Date(new Date().getTime() - 86400000).toISOString().split('T')[0]
                        : s.endDate,
                    daysUsed: response.type === "active_stopped" ? response.actuallyUsedDays : 0
                } : s))

                onRefresh?.()
            })
        } catch (error) {
            console.error("Erro ao interromper suspensão", error)
            toast.show({ title: "Erro ao interromper", description: error?.message || String(error), color: "danger" })
        }
    }

    const handleCancel = async (e) => {
        e?.preventDefault();

        console.log('[handleCancel] Iniciando cancelamento...');
        console.log('[handleCancel] Contrato selecionado:', selected);
        console.log('[handleCancel] Formulário de cancelamento:', cancelForm);

        if (!selected?.id) {
            console.warn('[handleCancel] Nenhum contrato selecionado!');
            toast.show({ title: "Nenhum contrato selecionado", color: "warning" });
            return;
        }

        if (!cancelForm.reason || cancelForm.reason.trim().length === 0) {
            console.warn('[handleCancel] Motivo não preenchido!');
            toast.show({ title: "Motivo obrigatório", description: "Informe o motivo do cancelamento.", color: "warning" });
            return;
        }

        try {
            await withLoading('cancel', async () => {
                const idClientContract = selected.id;

                const payload = {
                    idClientContract,
                    idClient,
                    clientName,
                    reason: cancelForm.reason,
                    canceledBy: null,
                    refundRevenue: false,
                    schedule: cancelForm.mode === "schedule",
                    cancelDate: cancelForm.mode === "schedule" ? cancelForm.date : null,
                    cancelOpenReceivables: cancelForm.cancelOpenReceivables,
                    cancelFutureSessions: cancelForm.cancelFutureSessions,
                    generateCredit: cancelForm.generateCredit,
                    creditAmount: cancelForm.generateCredit ? Number(cancelForm.creditAmount) : 0,
                    applyFine: cancelForm.applyFine,
                    fineAmount: cancelForm.applyFine ? Number(cancelForm.fineAmount) : 0,
                };

                console.log('[handleCancel] Payload sendo enviado:', payload);

                const result = await cancelClientContract(payload);

                console.log('[handleCancel] Resultado do cancelamento:', result);

                // Atualizar UI localmente
                setSelectedOverride(prev => ({
                    ...prev || selected,
                    status: cancelForm.mode === "schedule" ? "scheduled_cancellation" : "canceled",
                    ...(cancelForm.mode === "schedule" && { cancelDate: cancelForm.date }),
                    cancelReason: cancelForm.reason,
                }));

                // Mostrar toast
                if (cancelForm.mode !== "schedule") {
                    toast.show({
                        title: "Contrato cancelado",
                        color: "success",
                    });
                } else {
                    toast.show({
                        title: "Cancelamento agendado",
                        color: "success",
                    });
                }

                console.log('[handleCancel] Chamando onRefresh...');
                onRefresh?.();
                console.log('[handleCancel] Cancelamento concluído com sucesso!');
            });
        } catch (error) {
            console.error("[handleCancel] Erro ao cancelar contrato:", error);
            toast.show({ title: "Erro ao cancelar", description: error?.message || String(error), color: "danger" });
        }
    };

    return {
        selectedId,
        setSelectedId,
        activeAction,
        setActiveAction,
        adjustAddForm,
        setAdjustAddForm,
        adjustDebitForm,
        setAdjustDebitForm,
        cancelForm,
        setCancelForm,
        transferForm,
        setTransferForm,
        suspendForm,
        setSuspendForm,
        suspensions,
        selected,
        handleSuspend,
        handleStopSuspension,
        confirmStop,
        setConfirmStop,
        handleCancel,
        isLoading,
        selectedOverride
    }
}
