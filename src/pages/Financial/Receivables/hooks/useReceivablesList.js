import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { receivableRepository } from '../../../../data/repositories/ReceivableRepository';
import { bankAccountRepository } from '../../../../data/repositories/BankAccountRepository';
import { transactionRepository } from '../../../../data/repositories/TransactionRepository';
import { toast } from 'react-toastify';
import moment from 'moment';
import { formatCurrency } from '../../../../utils/format';

/**
 * Hook centralizado para gerenciar a lista de recebíveis, filtros e ações.
 */
export const useReceivablesList = () => {
    const { idTenant, idBranch } = useParams();

    // 1. Estados Principais
    const [receivables, setReceivables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);

    // Filtros
    const [statusFilter, setStatusFilter] = useState('open');
    const [dateRange, setDateRange] = useState({
        start: moment().startOf('month').format('YYYY-MM-DD'),
        end: moment().endOf('month').format('YYYY-MM-DD')
    });
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [fetchLimit, setFetchLimit] = useState(50);

    // 2. Carregar Dados do Servidor (Otimizado)
    const loadReceivables = useCallback(async () => {
        if (!idTenant || !idBranch) return;
        try {
            setIsLoading(true);

            const filters = [];

            // Filtro de Status no Servidor
            if (statusFilter !== 'all') {
                if (statusFilter === 'open') {
                    // 'open' no frontend inclui 'overdue' por data
                    filters.push(['status', '==', 'open']);
                } else {
                    filters.push(['status', '==', statusFilter]);
                }
            }

            // Filtro de Método de Pagamento no Servidor
            if (paymentFilter !== 'all') {
                filters.push(['paymentMethod', '==', paymentFilter]);
            }

            // Filtro de Data no Servidor (Convertendo string para Date para o Firestore)
            if (dateRange.start) filters.push(['dueDate', '>=', moment(dateRange.start).startOf('day').toDate()]);
            if (dateRange.end) filters.push(['dueDate', '<=', moment(dateRange.end).endOf('day').toDate()]);

            // Definir Limite (usando o estado de fetchLimit)
            const data = await receivableRepository.findWhere(
                idTenant, idBranch,
                filters,
                { field: 'dueDate', direction: 'asc' },
                fetchLimit
            );

            const today = moment().startOf('day');

            // Processar dados para identificar atrasos dinamicamente
            const processed = data.map(r => {
                const dueDate = r.dueDate?.seconds ? moment(r.dueDate.seconds * 1000) : moment(r.dueDate);
                const isOverdue = r.status === 'open' && dueDate.isValid() && dueDate.isBefore(today, 'day');

                return {
                    ...r,
                    isOverdue,
                    virtualStatus: isOverdue ? 'overdue' : r.status
                };
            });

            setReceivables(processed);
        } catch (error) {
            console.error("Erro ao carregar recebíveis:", error);
            toast.error("Erro ao sincronizar dados (verifique se os índices do Firestore foram criados).");
        } finally {
            setIsLoading(false);
        }
    }, [idTenant, idBranch, fetchLimit]); // Removido statusFilter, paymentFilter e dateRange para busca manual

    const handleLoadMore = useCallback(() => {
        setFetchLimit(prev => prev + 50);
    }, []);

    // Reset fetchLimit ao mudar filtros (opcional, mas bom manter)
    useEffect(() => {
        setFetchLimit(50);
    }, [statusFilter, paymentFilter, dateRange]);

    // Initial load only
    useEffect(() => {
        loadReceivables();
    }, [idTenant, idBranch]); // Só carrega no mount ou mudança de unidade

    // 3. Lógica de Seleção
    const toggleSelect = useCallback((id) => {
        const idStr = String(id);
        setSelectedIds(prev =>
            prev.includes(idStr) ? prev.filter(i => i !== idStr) : [...prev, idStr]
        );
    }, []);

    // 4. Dados Filtrados
    const filteredData = useMemo(() => {
        return receivables.filter(r => {
            // Filtros de busca textual continuam no front por serem leves
            const matchesSearch = !searchTerm ||
                (r.clientName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (String(r.saleNumber).includes(searchTerm)) ||
                (r.description?.toLowerCase().includes(searchTerm.toLowerCase()));

            return matchesSearch;
        });
    }, [receivables, searchTerm]);

    // 5. KPIs Totais
    const kpis = useMemo(() => {
        const totalPending = filteredData
            .filter(r => r.status === 'open' || r.status === 'overdue')
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

        const totalOverdue = filteredData
            .filter(r => r.status === 'overdue')
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

        const totalReceived = filteredData
            .filter(r => r.status === 'paid')
            .reduce((acc, curr) => acc + (parseFloat(curr.amountReceived || curr.amount) || 0), 0);

        return {
            pending: totalPending,
            overdue: totalOverdue,
            received: totalReceived,
            count: filteredData.length,
            countPending: filteredData.filter(r => r.virtualStatus === 'open' || r.virtualStatus === 'overdue').length,
            countOverdue: filteredData.filter(r => r.virtualStatus === 'overdue').length
        };
    }, [filteredData]);

    /**
     * Lógica de Antecipação de Recebíveis (Bulk)
     * 1. Atualiza Status do Recebível
     * 2. Cria Transação no Fluxo de Caixa (Income)
     * 3. Atualiza Saldo da Conta Bancária (Débito)
     */
    const handleAnticipate = async (data) => {
        try {
            const { receivableIds, idBankAccount, anticipationFee, totalNet, totalGross, totalExtraFee, settlementDate } = data;

            // 1. Buscar conta bancária
            const bankAccount = await bankAccountRepository.findById(idTenant, idBranch, idBankAccount);
            if (!bankAccount) throw new Error("Conta não encontrada");

            // 2. Processar cada recebível
            for (const id of receivableIds) {
                const rec = receivables.find(r => r.id === id);
                const gross = parseFloat(rec.amount) || 0;
                const feeShare = gross * (anticipationFee / 100);
                const netShare = gross - feeShare;

                // Atualizar o recebível
                await receivableRepository.update(idTenant, idBranch, id, {
                    status: 'paid',
                    settlementDate: settlementDate,
                    amountReceived: netShare,
                    extraFeeAmount: feeShare, // Guardamos a taxa de antecipação separada
                    idBankAccount,
                    notes: `Antecipado em ${moment().format('DD/MM/YYYY')}. Taxa: ${anticipationFee}%`,
                    updatedAt: new Date()
                });
            }

            // 3. Registrar Transações Financeiras
            // 3a. Entrada do Valor Bruto (Categorizada como Movimentação Interna para não duplicar na DRE)
            await transactionRepository.create(idTenant, idBranch, {
                date: settlementDate,
                description: `Antecipação (Valor Bruto) - ${receivableIds.length} títulos`,
                amount: totalGross,
                type: 'income',
                category: 'Movimentação Interna (Antecipação)', // DRE deve ignorar esta categoria
                idBankAccount,
                sourceType: 'receivable_bulk',
                createdAt: new Date()
            });

            // 3b. Saída da Taxa (Garante que o saldo final bata com o líquido)
            await transactionRepository.create(idTenant, idBranch, {
                date: settlementDate,
                description: `Taxa de Antecipação - ${anticipationFee}%`,
                amount: totalExtraFee,
                type: 'expense',
                category: 'Taxas Administrativas',
                idBankAccount,
                sourceType: 'receivable_fee',
                createdAt: new Date()
            });

            // 4. Atualizar Saldo Bancário Final
            const currentBalance = Number(bankAccount.currentBalance || 0);
            const newBalance = currentBalance + Number(totalNet);
            await bankAccountRepository.update(idTenant, idBranch, idBankAccount, {
                currentBalance: newBalance,
                updatedAt: new Date()
            });

            toast.success("Antecipação processada com sucesso!");
            setSelectedIds([]);
            loadReceivables();
        } catch (error) {
            console.error("Erro na antecipação:", error);
            toast.error("Erro ao processar antecipação.");
        }
    };

    const handleSettle = async (settlementData) => {
        try {
            const { id, totalAmount, idBankAccount, settlementDate, notes, keepRemainingOpen } = settlementData;

            // Buscar Recebível original para garantir dados
            const receivable = receivables.find(r => r.id === id);
            if (!receivable) throw new Error("Recebível não encontrado na lista atual.");

            // 1. Validar e Buscar Conta Bancária
            const bankAccount = await bankAccountRepository.findById(idTenant, idBranch, idBankAccount);
            if (!bankAccount) throw new Error("Conta bancária de destino não encontrada.");

            // 2. Criar Transação Financeira (Registro no Fluxo de Caixa)
            // Para cartões, o valor que entra na conta é o líquido (menos a taxa)
            const settlementAmount = Number(totalAmount);
            const feePercent = parseFloat(settlementData.estimatedFee) || 0;
            const feeAmount = feePercent > 0 ? (settlementAmount * (feePercent / 100)) : 0;
            const netSettlement = settlementAmount - feeAmount;

            const transactionData = {
                date: settlementDate,
                description: `Recebimento - ${receivable.clientName || 'ClienteIndefinido'}`,
                amount: netSettlement, // Valor Real que entra no banco
                grossAmount: settlementAmount, // Armazenamos o bruto para referência
                feeAmount: feeAmount, // Armazenamos a taxa separada
                type: 'income',
                category: 'Recebimento de Vendas',
                method: settlementData.paymentMethod || receivable.paymentMethod || 'other',
                provider: settlementData.provider || null,
                brand: settlementData.brand || null,
                auth: settlementData.auth || null,
                installments: parseInt(settlementData.installments) || 1,
                idBankAccount: idBankAccount,
                idSource: id,
                sourceType: 'receivable',
                notes: notes || '',
                createdAt: new Date().toISOString()
            };
            await transactionRepository.create(idTenant, idBranch, transactionData);

            // 3. Atualizar Saldo da Conta Bancária (Usa o valor LÍQUIDO)
            const currentBalance = Number(bankAccount.currentBalance || 0);
            const newBalance = currentBalance + netSettlement;
            await bankAccountRepository.update(idTenant, idBranch, idBankAccount, {
                currentBalance: newBalance,
                updatedAt: new Date()
            });

            // 4. Se for PARCIAL e o usuário escolheu manter aberto, gerar novo título
            const originalAmount = parseFloat(receivable.amount);
            const remaining = originalAmount - settlementAmount;

            if (keepRemainingOpen && remaining > 0.01) {
                await receivableRepository.create(idTenant, idBranch, {
                    ...receivable,
                    id: undefined,
                    amount: remaining,
                    netAmount: remaining,
                    status: 'open',
                    settlementDate: null,
                    amountReceived: 0,
                    notes: `Resíduo da liquidação parcial do título ${id}.`,
                    createdAt: new Date().toISOString()
                });
                toast.info(`Saldo de ${formatCurrency(remaining)} mantido em aberto.`);
            }

            // 5. Baixar o Recebível Atual
            await receivableRepository.update(idTenant, idBranch, id, {
                status: 'paid',
                settlementDate: settlementDate,
                amountReceived: netSettlement,
                extraFeeAmount: feeAmount,
                idBankAccount,
                paymentMethod: settlementData.paymentMethod || receivable.paymentMethod,
                updatedAt: new Date()
            });

            toast.success("Recebimento baixado com sucesso!");
            loadReceivables();
        } catch (error) {
            console.error("Erro ao baixar recebível:", error);
            toast.error("Erro ao processar baixa.");
        }
    };

    const handleCancel = async (id) => {
        try {
            // Verificar se já não está cancelado ou pago
            const item = receivables.find(r => r.id === id);
            if (!item) return;

            if (item.status === 'paid') {
                toast.warning("Não é possível cancelar um título já recebido.");
                return;
            }

            await receivableRepository.update(idTenant, idBranch, id, {
                status: 'cancelled',
                updatedAt: new Date()
            });

            toast.success("Título cancelado.");
            loadReceivables();
        } catch (error) {
            console.error("Erro ao cancelar:", error);
            toast.error("Erro ao cancelar título.");
        }
    };

    return {
        receivables,
        isLoading,
        filteredData,
        kpis,
        selectedIds,
        setSelectedIds,
        statusFilter,
        setStatusFilter,
        dateRange,
        setDateRange,
        paymentFilter,
        setPaymentFilter,
        searchTerm,
        setSearchTerm,
        toggleSelect,
        handleAnticipate,
        handleSettle,
        handleCancel,
        handleLoadMore,
        loadReceivables,
        hasMore: receivables.length === fetchLimit
    };
};
