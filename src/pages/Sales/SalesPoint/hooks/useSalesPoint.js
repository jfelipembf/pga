import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTenant } from '../../../../hooks/useTenant';
import { SalesService } from '../../../../services/Sales/SalesService';
import { AcquirerService } from '../../../../services/Financial/AcquirerService';
import { ContractService } from '../../../../services/Financial/ContractService';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../hooks/useAuth';

/**
 * Hook customizado para gerenciar a lógica da página de Ponto de Venda.
 * Segue o padrão de separação de UI e Lógica.
 */
export const useSalesPoint = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        idTenant,
        idBranch,
        tenantSlug,
        branchSlug,
        isReady
    } = useTenant();

    // 1. Obtenção de contexto (Usuário e Cliente)
    const { user } = useAuth();

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
    const [isLoadingData, setIsLoadingData] = useState(false);

    // 2.1 Novos campos da venda
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [discount, setDiscount] = useState('');
    const [isRenewal, setIsRenewal] = useState(false);

    // Carregar Dados Iniciais
    useEffect(() => {
        if (!isReady) return;

        const loadData = async () => {
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
    }, [isReady, idTenant, idBranch]);

    // 3. Ações de Interface
    const toggleTab = useCallback((tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    }, [activeTab]);

    const handleAddItem = useCallback((item) => {
        // Preserva o ID original do Firestore ANTES do spread
        const firestoreId = item.id;

        setCartItems(prev => [...prev, {
            // Dados do item (name, price, type, etc)
            name: item.name || item.title,
            type: item.type || (item.category === 'Produto' ? 'product' : item.category === 'Serviço' ? 'service' : 'contract'),
            unitPrice: parseFloat(item.price) || 0,
            quantity: 1,
            totalPrice: parseFloat(item.price) || 0,

            // IDs: SEPARAR CLARAMENTE!
            cartId: Date.now(), // ID único no carrinho (para remoção)
            id: firestoreId, // ID original do Firestore (para busca)
            idItem: firestoreId, // Compatibilidade com backend
        }]);
    }, []);

    const handleAddPayment = useCallback((payment) => {
        setPayments(prev => [...prev, {
            ...payment,
            id: Date.now(),
            value: parseFloat(payment.value) || 0
        }]);
    }, []);

    const handleRemoveItem = useCallback((cartId) => {
        setCartItems(prev => prev.filter(i => i.cartId !== cartId));
    }, []);

    const handleRemovePayment = useCallback((id) => {
        setPayments(prev => prev.filter(p => p.id !== id));
    }, []);

    // 4. Cálculos Financeiros em Tempo Real
    const totals = useMemo(() => {
        const subtotal = cartItems.reduce((acc, curr) => acc + (parseFloat(curr.totalPrice || curr.price) || 0), 0);
        const totalWithDiscount = Math.max(0, subtotal - (parseFloat(discount) || 0));
        const totalPaid = payments.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);
        const balance = Math.max(0, totalWithDiscount - totalPaid);
        const surplus = Math.max(0, totalPaid - totalWithDiscount);
        return { subtotal, discount: parseFloat(discount) || 0, total: totalWithDiscount, totalPaid, balance, surplus };
    }, [cartItems, payments, discount]);

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
                startDate: new Date(startDate),
                isRenewal: isRenewal,
                idClient: idClient,
                clientName: clientName,
                friendlyId: friendlyId,
                idSeller: user.uid,
                sellerName: user.displayName || user.email || 'Vendedor',
                userName: user.displayName || user.email || 'Vendedor', // Explicitamente para Auditoria
                items: cartItems.map(item => ({
                    type: item.type, // Usa o type do item (contract, product, service)
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
                    provider: p.providerName || p.provider || null,
                    idAcquirer: p.provider || null,
                    brand: p.brand || null,
                    auth: p.auth || null,
                    netValue: p.netValue || p.value // Valor líquido (se calculado)
                })),
                subtotal: totals.subtotal,
                discount: totals.discount,
                total: totals.total,
                totalPaid: totals.totalPaid,
                balance: totals.balance,
                surplus: totals.surplus, // Informativo
                dueDateBalance: finalizeData.dueDate ? new Date(finalizeData.dueDate) : null,
                status: totals.balance > 0.01 ? 'partial' : 'paid'
            };

            // Validação Final no Frontend antes de enviar
            if (totals.surplus > 0.01) {
                toast.warning(`Atenção: Os pagamentos (R$ ${totals.totalPaid.toFixed(2)}) excedem o total da venda (R$ ${totals.total.toFixed(2)}). Ajuste os valores.`);
                setIsProcessing(false);
                return;
            }

            await SalesService.processSale(idTenant, idBranch, user.uid, salePayload);

            toast.success("Venda Finalizada!");

            setTimeout(() => {
                // Use SLUGS for friendly navigation
                navigate(`/${tenantSlug}/${branchSlug}/clients/${idClient}`);
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
        handleFinalizeSale,
        // Novos estados expostos
        startDate, setStartDate,
        discount, setDiscount,
        isRenewal, setIsRenewal
    };
};
