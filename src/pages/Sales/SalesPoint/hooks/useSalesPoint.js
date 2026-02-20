import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTenant } from '../../../../hooks/useTenant';
import { SalesService } from '../../../../services/Sales/SalesService';
import { AcquirerService } from '../../../../services/Financial/AcquirerService';
import { ContractService } from '../../../../services/Financial/ContractService';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../hooks/useAuth';
import { normalizeDate, parseDateInput } from '../../../../utils/date';

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
    const [isLoadingData, setIsLoadingData] = useState(true);

    // 2.1 Novos campos da venda
    const [saleDate, setSaleDate] = useState(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    });
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    });
    const [discount, setDiscount] = useState('');

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
            isScholarship: !!item.isScholarship,

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
    const [saleSuccessData, setSaleSuccessData] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    const handleCloseReceipt = useCallback(() => {
        setShowReceiptModal(false);
        navigate(`/${tenantSlug || idTenant}/${branchSlug || idBranch}/clients/${idClient}`);
    }, [navigate, tenantSlug, branchSlug, idTenant, idBranch, idClient]);

    const handleFinalizeSale = async (finalizeData) => {
        if (!idClient) {
            toast.error("ID do cliente não encontrado.");
            return;
        }

        if (!user || user.status === 'inactive') { // Validação extra opcional
            // ...
        }

        try {
            setIsProcessing(true);

            // Construct the complete payload
            // IMPORTANTE: usar normalizeDate para strings YYYY-MM-DD vindas de inputs HTML.
            // new Date("2025-01-15") interpreta como UTC midnight, causando deslocamento de 1 dia
            // em fusos negativos (ex: UTC-3 → salva como 14/01 às 21h).
            const normalizedSaleDate = parseDateInput(saleDate);
            const normalizedStartDate = parseDateInput(startDate);

            const payload = {
                idClient,
                clientName, // Store for history
                friendlyId, // Store for history
                idSeller: user.uid,
                sellerName: user.displayName || user.email || 'Vendedor',

                saleDate: normalizedSaleDate,
                startDate: normalizedStartDate,

                // Items — startDate é passado por item para que o SalesService
                // possa calcular a vigência do contrato corretamente.
                items: cartItems.map(item => ({
                    type: item.type,
                    idItem: item.idItem, // Original ID
                    name: item.name,
                    quantity: 1,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    isScholarship: item.isScholarship || false,
                    startDate: normalizedStartDate // ✅ Necessário para calcular endDate do contrato
                })),

                // Payments
                payments: payments.map(p => ({
                    methodId: p.methodId,
                    methodLabel: p.methodLabel,
                    value: p.value,
                    installments: parseInt(p.installments) || 1,
                    idAcquirer: p.provider || null, // ID
                    provider: p.providerName || null, // Name
                    brand: p.brand || null,
                    auth: p.auth || null,
                    netValue: p.netValue
                })),

                // Totals
                subtotal: totals.subtotal,
                discount: totals.discount,
                total: totals.total,
                totalPaid: totals.totalPaid,
                balance: totals.balance,
                surplus: totals.surplus,

                // From Finalize Step
                dueDateBalance: parseDateInput(finalizeData.dueDate), // parseDateInput evita bug de fuso
                status: totals.balance > 0.01 ? 'partial' : 'paid',

                // Metadata
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await SalesService.processSale(idTenant, idBranch, user.uid, payload);

            setSaleSuccessData({ ...payload, saleNumber: result.saleNumber });
            setShowReceiptModal(true);
            toast.success("Venda realizada com sucesso!");

        } catch (error) {
            console.error("Erro ao finalizar venda:", error);
            toast.error(error.message || "Erro ao processar venda");
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        isReady,
        clientName,
        activeTab,
        cartItems,
        payments,
        isProcessing,
        isLoadingData: isLoadingData || !isReady,
        data: {
            acquirers,
            contracts
        },
        totals,
        // Novos estados expostos
        saleDate, setSaleDate,
        startDate, setStartDate,
        discount, setDiscount,
        // Recibo
        saleSuccessData,
        showReceiptModal,
        handleCloseReceipt,
        // Actions
        toggleTab,
        handleAddItem,
        handleAddPayment,
        handleRemoveItem,
        handleRemovePayment,
        handleFinalizeSale
    };
};
