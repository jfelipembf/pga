import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTenant } from '../../../../hooks/useTenant';
import { SalesService } from '../../../../services/Sales/SalesService';
import { AcquirerService } from '../../../../services/Financial/AcquirerService';
import { ContractService } from '../../../../services/Contracts/ContractService';
import { toast } from 'react-toastify';

/**
 * Hook customizado para gerenciar a lógica da página de Ponto de Venda.
 * Segue o padrão de separação de UI e Lógica.
 */
export const useSalesPoint = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { tenantId: idTenant, branchId: idBranch } = useTenant();

    // 1. Obtenção de contexto (Usuário e Cliente)
    const user = useMemo(() => {
        const authUser = localStorage.getItem("authUser");
        return authUser ? JSON.parse(authUser) : null;
    }, []);

    const idClient = location.state?.idClient;
    const clientName = location.state?.clientName || "Cliente";
    const friendlyId = location.state?.friendlyId || "";

    // 2. Estados da Venda e Dados
    const [activeTab, setActiveTab] = useState('1');
    const [cartItems, setCartItems] = useState([]);
    const [payments, setPayments] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Dados Carregados
    const [acquirers, setAcquirers] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Carregar Dados Iniciais
    useEffect(() => {
        const loadData = async () => {
            if (!idTenant || !idBranch) return;

            try {
                setIsLoadingData(true);
                const [acqs, conts] = await Promise.all([
                    AcquirerService.listAll(idTenant, idBranch),
                    ContractService.listActiveContracts(idTenant, idBranch)
                ]);

                const activeAcquirers = acqs.filter(a => a.isActive);
                setAcquirers(activeAcquirers);
                setContracts(conts);
            } catch (error) {
                console.error("Erro ao carregar dados do PDV:", error);
                toast.error("Erro ao carregar configurações de venda.");
            } finally {
                setIsLoadingData(false);
            }
        };
        loadData();
    }, [idTenant, idBranch]);

    // 3. Ações de Interface
    const toggleTab = useCallback((tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    }, [activeTab]);

    const handleAddItem = useCallback((item) => {
        setCartItems(prev => [...prev, {
            ...item,
            id: Date.now(),
            idItem: item.id || 'custom',
            quantity: 1,
            unitPrice: parseFloat(item.price) || 0,
            totalPrice: parseFloat(item.price) || 0
        }]);
    }, []);

    const handleAddPayment = useCallback((payment) => {
        setPayments(prev => [...prev, {
            ...payment,
            id: Date.now(),
            value: parseFloat(payment.value) || 0
        }]);
    }, []);

    const handleRemoveItem = useCallback((id) => {
        setCartItems(prev => prev.filter(i => i.id !== id));
    }, []);

    const handleRemovePayment = useCallback((id) => {
        setPayments(prev => prev.filter(p => p.id !== id));
    }, []);

    // 4. Cálculos Financeiros em Tempo Real
    const totals = useMemo(() => {
        const subtotal = cartItems.reduce((acc, curr) => acc + (parseFloat(curr.totalPrice || curr.price) || 0), 0);
        const totalPaid = payments.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);
        const balance = subtotal - totalPaid;
        return { subtotal, totalPaid, balance };
    }, [cartItems, payments]);

    // 5. Lógica de Finalização (Integração com Service)
    const handleFinalizeSale = async (finalizeData) => {
        if (!idClient) {
            toast.error("ID do cliente não encontrado.");
            return;
        }

        if (!user || !user.uid) {
            toast.error("Usuário não autenticado.");
            return;
        }

        try {
            setIsProcessing(true);

            // Preparação do Payload Seguro
            const salePayload = {
                saleDate: new Date(),
                idClient: idClient,
                clientName: clientName,
                friendlyId: friendlyId,
                idSeller: user.uid,
                sellerName: user.displayName || user.email || 'Vendedor',
                items: cartItems.map(item => ({
                    type: item.category?.toLowerCase() === 'contrato' ? 'contract' : (item.category?.toLowerCase() === 'produto' ? 'product' : 'service'),
                    idItem: item.idItem,
                    name: item.name,
                    quantity: item.quantity || 1,
                    unitPrice: item.unitPrice || 0,
                    totalPrice: item.totalPrice || 0
                })),
                payments: payments.map(p => ({
                    methodId: p.methodId,
                    methodLabel: p.methodLabel,
                    value: p.value || 0,
                    installments: parseInt(p.installments) || 1,
                    provider: p.provider || null,
                    brand: p.brand || null,
                    auth: p.auth || null,
                    netValue: p.netValue || p.value // Valor líquido (se calculado)
                })),
                subtotal: totals.subtotal,
                discount: 0,
                total: totals.subtotal,
                totalPaid: totals.totalPaid,
                balance: totals.balance,
                dueDateBalance: finalizeData.dueDate ? new Date(finalizeData.dueDate) : null,
                status: totals.balance > 0.01 ? 'partial' : 'completed'
            };

            await SalesService.processSale(idTenant, idBranch, user.uid, salePayload);

            toast.success("Venda Finalizada!");

            setTimeout(() => {
                navigate(`/${idTenant}/${idBranch}/clients/${idClient}`);
            }, 1000);

        } catch (error) {
            console.error("Erro no processamento:", error);
            toast.error(error.message || "Erro ao processar venda.");
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        clientName,
        activeTab,
        cartItems,
        payments,
        isProcessing,
        isLoadingData,
        data: {
            acquirers,
            contracts
        },
        totals,
        toggleTab,
        handleAddItem,
        handleAddPayment,
        handleRemoveItem,
        handleRemovePayment,
        handleFinalizeSale
    };
};
