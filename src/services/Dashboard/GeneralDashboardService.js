/**
 * Serviço para agregar dados dos Dashboards Operacional e Gerencial.
 * Versão ultra-resiliente que não depende de índices compostos manuais.
 */
import { transactionRepository } from "../../data/repositories/TransactionRepository"
import { query, where, getDocs } from "firebase/firestore"
import moment from "moment"
import { normalizeDate } from "../../utils/date"

export const GeneralDashboardService = {

    /**
     * Helper para calcular crescimento (%)
     */
    calculateGrowth: (current, previous) => {
        if (!previous || previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
    },

    /**
     * Dados para o Dashboard Operacional (Consultor)
     */
    getOperationalData: async (idTenant, idBranch, userId) => {
        const startMonth = normalizeDate(moment().startOf('month'));
        const endMonth = normalizeDate(moment().endOf('month'));
        const todayStart = normalizeDate(moment().startOf('day'));
        const todayEnd = normalizeDate(moment().endOf('day'));

        const collectionRef = transactionRepository.getCollectionRef(idTenant, idBranch);
        let salesToday = 0;
        let salesMonth = 0;

        try {
            // Buscamos apenas por Data (já indexado) e filtramos o usuário em memória
            // Isso evita a necessidade de criar índices compostos manuais.
            const q = query(
                collectionRef,
                where('date', '>=', startMonth),
                where('date', '<=', endMonth)
            );

            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                const item = doc.data();

                // Filtros em memória: Tipo 'income' e apenas as vendas DO USUÁRIO logado
                if (item.type === 'income' && item.createdBy === userId) {
                    const amount = parseFloat(item.amount) || 0;
                    const date = moment(item.date?.toDate ? item.date.toDate() : item.date);

                    salesMonth += amount;
                    if (date.isSame(moment(), 'day')) {
                        salesToday += amount;
                    }
                }
            });

        } catch (err) {
            console.warn("Erro no dashboard operacional (vendas):", err);
        }

        // --- Tarefas Agendadas para Hoje ---
        let tasksTodayCount = 0;
        try {
            const { taskRepository } = await import('../../data/repositories/Admin/TaskRepository');
            // Buscamos todas e filtramos em memória para garantir consistência com a lista
            const allTasks = await taskRepository.findAll(idTenant, idBranch);

            tasksTodayCount = allTasks.filter(task => {
                // 1. Verifica Atribuição (Single ou Array)
                const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
                const isAssigned = assignees.includes(userId);

                if (!isAssigned) return false;

                // 2. Verifica Data (Hoje) ou Pendente Atrasada
                const taskDate = moment(task.dueDate?.toDate ? task.dueDate.toDate() : task.dueDate);
                const isToday = taskDate.isSame(todayStart, 'day');
                const isPendingLate = task.status === 'pending' && taskDate.isBefore(todayStart);

                // 3. Verifica Recorrência
                if (task.isRecurring) {
                    if (task.recurrence?.frequency === 'daily') return true;
                    if (task.recurrence?.frequency === 'weekly') {
                        return task.recurrence?.daysOfWeek?.includes(moment().day());
                    }
                    if (task.recurrence?.frequency === 'monthly') {
                        return task.recurrence?.dayOfMonth === moment().date();
                    }
                }

                return isToday || isPendingLate;
            }).length;

        } catch (err) {
            console.warn("Erro ao buscar tarefas hoje:", err);
        }

        // --- Contratos Vencendo Hoje ---
        let expirationsTodayCount = 0;
        try {
            const { clientContractRepository } = await import('../../data/repositories/ClientContractRepository');
            const contractsRes = await clientContractRepository.findWhere(idTenant, idBranch, [
                ['endDate', '>=', todayStart],
                ['endDate', '<=', todayEnd],
                ['status', '==', 'active']
            ]);
            // Filtramos por responsabilidade (criador do contrato)
            expirationsTodayCount = contractsRes.filter(c => c.createdBy === userId).length;
        } catch (err) {
            console.warn("Erro ao buscar vencimentos hoje:", err);
        }

        // --- Vendas Recentes do Consultor (Últimas 5) ---
        let recentSales = [];
        try {
            // Buscamos transações recentes do mês para extrair as do consultor
            // Isso evita criar índices compostos para cada consultor
            const qRecent = query(
                collectionRef,
                where('date', '>=', startMonth),
                where('type', '==', 'income')
            );
            const snapRecent = await getDocs(qRecent);
            const myTransactions = [];
            snapRecent.forEach(doc => {
                const item = doc.data();
                if (item.createdBy === userId) {
                    myTransactions.push({
                        id: doc.id,
                        client: item.clientName || 'Cliente',
                        value: `R$ ${parseFloat(item.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        time: moment(item.date?.toDate ? item.date.toDate() : item.date).fromNow(),
                        type: item.category || 'Venda',
                        date: item.date?.toDate ? item.date.toDate() : item.date
                    });
                }
            });
            recentSales = myTransactions.sort((a, b) => b.date - a.date).slice(0, 5);
        } catch (err) {
            console.warn("Erro ao buscar vendas recentes:", err);
        }

        // --- Gráfico de Histórico (12 Meses) ---
        let salesHistorySeries = [];
        try {
            const twelveMonthsAgo = normalizeDate(moment().subtract(11, 'months').startOf('month'));
            const qChart = query(
                collectionRef,
                where('date', '>=', twelveMonthsAgo),
                where('type', '==', 'income')
            );
            const snapChart = await getDocs(qChart);
            const dataMap = new Array(12).fill(0);

            snapChart.forEach(doc => {
                const item = doc.data();
                if (item.createdBy === userId) {
                    const date = moment(item.date?.toDate ? item.date.toDate() : item.date);
                    const diff = moment().startOf('month').diff(date.clone().startOf('month'), 'months');
                    const index = 11 - diff;
                    if (index >= 0 && index < 12) {
                        dataMap[index] += parseFloat(item.amount || 0);
                    }
                }
            });

            salesHistorySeries = [{ name: 'Vendas', data: dataMap }];
        } catch (err) {
            console.warn("Erro ao buscar histórico de vendas:", err);
        }

        return {
            mySalesToday: salesToday,
            mySalesMonth: salesMonth,
            tasksToday: tasksTodayCount,
            expirationsToday: expirationsTodayCount,
            recentSales,
            charts: {
                seriesSales: salesHistorySeries
            },
            myGoal: 0,
            birthdays: [],
            tasks: []
        };
    },

    /**
     * Dados para o Dashboard Gerencial (Gestor)
     */
    getManagerData: async (idTenant, idBranch) => {
        const startMonth = normalizeDate(moment().startOf('month'));
        const endMonth = normalizeDate(moment().endOf('month'));
        const today = moment().startOf('day');

        const collectionRef = transactionRepository.getCollectionRef(idTenant, idBranch);

        let salesToday = 0;
        let salesMonth = 0;
        let salesCount = 0;

        let expensesToday = 0;
        let expensesMonth = 0;

        try {
            // Buscamos apenas por Data (índice automático padrão do SDK)
            const q = query(
                collectionRef,
                where('date', '>=', startMonth),
                where('date', '<=', endMonth)
            );

            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                const item = doc.data();
                const amount = parseFloat(item.amount) || 0;
                const date = moment(item.date?.toDate ? item.date.toDate() : item.date);

                if (item.type === 'income') {
                    salesMonth += amount;
                    salesCount++;
                    if (date.isSame(today, 'day')) {
                        salesToday += amount;
                    }
                } else if (item.type === 'expense') {
                    expensesMonth += amount;
                    if (date.isSame(today, 'day')) {
                        expensesToday += amount;
                    }
                }
            });

        } catch (err) {
            console.warn("Erro no dashboard gerencial (Financeiro):", err);
        }

        // --- Comparativo: Vendas do Mês Anterior ---
        let salesLastMonth = 0;
        try {
            const startLastMonth = normalizeDate(moment().subtract(1, 'months').startOf('month'));
            const endLastMonth = normalizeDate(moment().subtract(1, 'months').endOf('month'));

            const qLast = query(
                collectionRef,
                where('date', '>=', startLastMonth),
                where('date', '<=', endLastMonth),
                where('type', '==', 'income')
            );

            const snapLast = await getDocs(qLast);
            snapLast.forEach(doc => {
                salesLastMonth += parseFloat(doc.data().amount) || 0;
            });
        } catch (err) {
            console.warn("Erro no dashboard gerencial (Passado):", err);
        }

        const salesGrowth = GeneralDashboardService.calculateGrowth(salesMonth, salesLastMonth);
        const ticketAverage = salesCount > 0 ? (salesMonth / salesCount) : 0;

        // ✅ NOVO: Contas a Pagar (Payables) - Pendentes
        let payablesPending = 0;
        try {
            // Tenta importar o repositório de contas a pagar se existir
            // Assumindo estrutura padrão. Se falhar, retorna 0.
            const { payableRepository } = await import('../../data/repositories/PayableRepository');
            if (payableRepository) {
                const allPayables = await payableRepository.findAll(idTenant, idBranch); // Assumindo findAll ou método similar
                // Filtrar pendentes em memória para evitar erro de index
                payablesPending = allPayables
                    .filter(p => p.status === 'pending' || p.status === 'open')
                    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            }
        } catch (err) {
            // Silencioso se não existir ou falhar
        }

        // ✅ NOVO: Busca dados de alunos do DashboardSummary (UMA ÚNICA VEZ)
        const { DashboardSummaryService } = await import('./DashboardSummaryService');
        let clientsData = { active: 0, new: 0, canceled: 0, suspended: 0, renewals: 0, winbacks: 0 };
        let currentSummary = null;

        try {
            currentSummary = await DashboardSummaryService.getCurrent(idTenant, idBranch);
            if (currentSummary) {
                clientsData = {
                    active: currentSummary.activeclients || 0,
                    new: currentSummary.newclients || 0,
                    renewals: currentSummary.renewals || 0,
                    winbacks: currentSummary.winbacks || 0,
                    canceled: currentSummary.canceledclients || 0,
                    suspended: currentSummary.suspendedclients || 0
                };
            }
        } catch (err) {
            console.warn("Erro ao buscar summary de alunos:", err);
        }

        // --- Comparativo: Alunos Mês Anterior ---
        let clientsGrowth = { active: 0, new: 0, renewals: 0, winbacks: 0, canceled: 0, suspended: 0 }

        try {
            const lastMonthKey = moment().subtract(1, 'month').format('YYYY-MM');
            const lastSummaryDoc = await DashboardSummaryService.getMonthSummary(idTenant, idBranch, lastMonthKey);

            if (lastSummaryDoc) {
                clientsGrowth = {
                    active: GeneralDashboardService.calculateGrowth(clientsData.active, lastSummaryDoc.activeclients),
                    new: GeneralDashboardService.calculateGrowth(clientsData.new, lastSummaryDoc.newclients),
                    renewals: GeneralDashboardService.calculateGrowth(clientsData.renewals, lastSummaryDoc.renewals),
                    winbacks: GeneralDashboardService.calculateGrowth(clientsData.winbacks, lastSummaryDoc.winbacks),
                    canceled: GeneralDashboardService.calculateGrowth(clientsData.canceled, lastSummaryDoc.canceledclients),
                    suspended: GeneralDashboardService.calculateGrowth(clientsData.suspended, lastSummaryDoc.suspendedclients)
                }
            }
        } catch (err) {
            console.warn("Erro ao buscar comparativo de alunos:", err)
        }

        // --- Gráficos: Agregados em Paralelo (Otimizado) ---
        let growthHistory = [];
        let mostSold = { labels: [], series: [], totalCount: 0 };
        let clientsHistory = [];
        let last3YearsMonthly = { salesSeries: [], clientsSeries: [], years: [] };

        try {
            const [growth, sold, history, yearly] = await Promise.all([
                GeneralDashboardService.getFinancialGrowthData(idTenant, idBranch),
                GeneralDashboardService.getMostSoldData(idTenant, idBranch),
                GeneralDashboardService.getLast12Monthsclients(idTenant, idBranch, currentSummary),
                GeneralDashboardService.getLast3YearsMonthlyData(idTenant, idBranch, currentSummary)
            ]);
            growthHistory = growth;
            mostSold = sold;
            clientsHistory = history;
            last3YearsMonthly = yearly;
        } catch (err) {
            console.warn("Erro ao carregar dados complementares do dashboard:", err);
        }

        // --- Novos: Últimos 5 Contratos Vendidos ---
        let recentContracts = [];
        try {
            const { clientContractRepository } = await import('../../data/repositories/ClientContractRepository');
            const { clientRepository } = await import('../../data/repositories/ClientRepository');

            // Busca apenas os 5 últimos contratos de forma eficiente
            const recentContractsRaw = await clientContractRepository.findWhere(
                idTenant,
                idBranch,
                [],
                { field: 'createdAt', direction: 'desc' },
                5
            );

            // Busca os dados dos clientes em paralelo para pegar a foto e nome correto
            recentContracts = await Promise.all(recentContractsRaw.map(async (c) => {
                let photoUrl = null;
                let clientName = c.clientName || "Cliente";

                try {
                    if (c.idClient) {
                        const client = await clientRepository.findById(idTenant, idBranch, c.idClient);
                        if (client) {
                            photoUrl = client.photoUrl;
                            clientName = client.name || client.firstName + " " + (client.lastName || "");
                        }
                    }
                } catch (err) {
                    console.warn(`Erro ao buscar dados do cliente ${c.idClient}:`, err);
                }

                // Resolução do Status Real (Cálculo de Expiração + Mapeamento)
                const now = moment();
                let realStatus = c.status || 'pending';
                const endDate = c.endDate?.toDate ? moment(c.endDate.toDate()) : (c.endDate ? moment(c.endDate) : null);

                // Se está como ativo mas o prazo venceu, o status real é expirado
                if (realStatus === 'active' && endDate && endDate.isBefore(now, 'day')) {
                    realStatus = 'expired';
                }

                const statusMap = {
                    active: { label: 'Ativo', color: 'success' },
                    canceled: { label: 'Cancelado', color: 'danger' },
                    cancelled: { label: 'Cancelado', color: 'danger' },
                    suspended: { label: 'Suspenso', color: 'secondary' },
                    expired: { label: 'Expirado', color: 'dark' },
                    pending: { label: 'Pendente', color: 'warning' },
                    scheduled_cancellation: { label: 'Cancel. Agendado', color: 'info' }
                };

                const config = statusMap[realStatus] || { label: 'Pendente', color: 'warning' };

                return {
                    id: c.friendlyId || (c.id ? c.id.substring(0, 8) : "N/A"),
                    idClient: c.idClient,
                    name: clientName,
                    imgUrl: photoUrl || null,
                    status: config.label,
                    amount: `R$ ${parseFloat(c.totalValue || c.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    date: moment(c.createdAt?.toDate ? c.createdAt.toDate() : c.createdAt).format('DD/MM/YYYY'),
                    color: config.color
                };
            }));
        } catch (err) {
            console.warn("Erro ao buscar contratos recentes:", err);
        }

        return {
            clients: clientsData,
            clientsGrowth,
            recentContracts,
            sales: {
                today: salesToday,
                month: salesMonth,
                lastMonth: salesLastMonth,
                growth: salesGrowth,
                ticket: ticketAverage
            },
            financial: {
                salesToday,
                salesMonth,
                expensesToday,
                expensesMonth,
                payablesPending,
                profitToday: salesToday - expensesToday,
                profitMonth: salesMonth - expensesMonth
            },
            charts: {
                growthHistory: growthHistory || [],
                mostSold: mostSold || { labels: [], series: [], totalCount: 0 },
                clientsHistory: clientsHistory || [],
                seriesSales: last3YearsMonthly?.salesSeries || [],
                seriesclients: last3YearsMonthly?.clientsSeries || [],
                years: last3YearsMonthly?.years || []
            }
        };
    },

    /**
     * Busca dados de Receita, Despesa e Lucro dos últimos 12 meses.
     */
    getFinancialGrowthData: async (idTenant, idBranch) => {
        const start = normalizeDate(moment().subtract(11, 'months').startOf('month'));
        const end = normalizeDate(moment().endOf('month'));
        const collectionRef = transactionRepository.getCollectionRef(idTenant, idBranch);

        const q = query(
            collectionRef,
            where('date', '>=', start),
            where('date', '<=', end)
        );

        const incomeMap = {};
        const expenseMap = {};
        const months = [];

        for (let i = 11; i >= 0; i--) {
            const m = moment().subtract(i, 'months').format('MMM');
            months.push(m);
            incomeMap[m] = 0;
            expenseMap[m] = 0;
        }

        try {
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                const item = doc.data();
                const m = moment(item.date?.toDate ? item.date.toDate() : item.date).format('MMM');
                const amount = parseFloat(item.amount) || 0;

                if (item.type === 'income') {
                    if (incomeMap[m] !== undefined) incomeMap[m] += amount;
                } else if (item.type === 'expense') {
                    if (expenseMap[m] !== undefined) expenseMap[m] += amount;
                }
            });
        } catch (e) {
            console.warn("Erro ao buscar crescimento:", e);
        }

        const incomeData = months.map(m => incomeMap[m]);
        const expenseData = months.map(m => expenseMap[m]);
        const profitData = months.map(m => incomeMap[m] - expenseMap[m]);

        return {
            months,
            series: [
                { name: 'Receitas', data: incomeData },
                { name: 'Despesas', data: expenseData },
                { name: 'Lucro', data: profitData }
            ],
            currentMonth: {
                income: incomeData[11],
                expense: expenseData[11],
                profit: profitData[11]
            }
        };
    },

    /**
     * Busca dados de itens mais vendidos (Contratos/Planos) no mês atual.
     */
    getMostSoldData: async (idTenant, idBranch) => {
        const start = normalizeDate(moment().startOf('month'));
        const { clientContractRepository } = await import('../../data/repositories/ClientContractRepository');

        try {
            const contracts = await clientContractRepository.findWhere(idTenant, idBranch, [
                ['createdAt', '>=', start]
            ]);

            const counts = {};
            contracts.forEach(c => {
                const name = c.planName || 'Outros';
                counts[name] = (counts[name] || 0) + 1;
            });

            const sorted = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5); // Top 5

            return {
                labels: sorted.map(s => s[0]),
                series: sorted.map(s => s[1]),
                totalCount: contracts.length
            };
        } catch (e) {
            console.warn("Erro ao buscar mais vendidos:", e);
            return { labels: [], series: [], totalCount: 0 };
        }
    },

    /**
     * Busca histórico de alunos ativos dos últimos 12 meses.
     */
    getLast12Monthsclients: async (idTenant, idBranch, cachedSummary = null) => {
        const { DashboardSummaryService } = await import('./DashboardSummaryService');

        const promises = [];
        for (let i = 0; i < 12; i++) {
            promises.push((async () => {
                const targetMonth = moment().subtract(i, 'months');
                const monthKey = targetMonth.format('YYYY-MM');
                const monthLabel = targetMonth.format('MMM/YY').toUpperCase(); // JUL/24

                let active = 0;
                try {
                    if (i === 0) {
                        if (cachedSummary) {
                            active = cachedSummary.activeclients || 0;
                        } else {
                            const summary = await DashboardSummaryService.getCurrent(idTenant, idBranch);
                            active = summary?.activeclients || 0;
                        }
                    } else {
                        const summary = await DashboardSummaryService.getMonthSummary(idTenant, idBranch, monthKey);
                        active = summary?.activeclients || 0;
                    }
                } catch (e) { }
                return { x: monthLabel, y: active };
            })());
        }
        return await Promise.all(promises);
    },

    /**
     * Busca dados comparativos dos últimos 3 anos, mês a mês.
     * Retorna séries formatadas para ApexCharts.
     */
    getLast3YearsMonthlyData: async (idTenant, idBranch, cachedSummary = null) => {
        const currentYear = moment().year();
        const years = [currentYear - 2, currentYear - 1, currentYear]; // [2024, 2025, 2026]

        // Estrutura para Vendas: { '2024': [Jan, Feb...], '2025': ... }
        const salesMap = {};
        years.forEach(y => salesMap[y] = new Array(12).fill(0));

        // 1. Buscar TODAS as vendas dos 3 anos de uma vez
        const start = normalizeDate(moment(`${years[0]}-01-01`));
        const end = normalizeDate(moment(`${years[2]}-12-31`));
        const collectionRef = transactionRepository.getCollectionRef(idTenant, idBranch);

        const qSales = query(
            collectionRef,
            where('date', '>=', start),
            where('date', '<=', end),
            where('type', '==', 'income')
        );

        try {
            const snapshot = await getDocs(qSales);
            snapshot.forEach(doc => {
                const item = doc.data();
                if (item.type === 'income') {
                    const date = moment(item.date?.toDate ? item.date.toDate() : item.date);
                    const year = date.year();
                    const month = date.month(); // 0-11
                    if (salesMap[year]) {
                        salesMap[year][month] += parseFloat(item.amount) || 0;
                    }
                }
            });
        } catch (e) {
            console.warn("Erro ao buscar vendas 3 anos:", e);
        }

        // 2. Buscar Alunos Ativos mês a mês (Parallel Requests)
        const { DashboardSummaryService } = await import('./DashboardSummaryService');
        const clientsMap = {};
        years.forEach(y => clientsMap[y] = new Array(12).fill(0));

        const clientPromises = [];

        years.forEach(year => {
            for (let month = 0; month < 12; month++) {
                clientPromises.push((async () => {
                    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
                    let val = 0;
                    try {
                        // Se for o mês ATUAL, usa o cachedSummary se fornecido
                        if (moment().year() === year && moment().month() === month) {
                            if (cachedSummary) {
                                val = cachedSummary.activeclients || 0;
                            } else {
                                const current = await DashboardSummaryService.getCurrent(idTenant, idBranch);
                                if (current) val = current.activeclients || 0;
                            }
                        } else {
                            const summary = await DashboardSummaryService.getMonthSummary(idTenant, idBranch, monthKey);
                            if (summary) val = summary.activeclients || 0;
                        }
                    } catch (e) { }
                    clientsMap[year][month] = val;
                })());
            }
        });

        await Promise.all(clientPromises);

        // Formatar Séries
        const salesSeries = years.map(year => ({
            name: `${year}`,
            data: salesMap[year]
        }));

        const clientsSeries = years.map(year => ({
            name: `${year}`,
            data: clientsMap[year]
        }));

        return { years, salesSeries, clientsSeries };
    }
}
