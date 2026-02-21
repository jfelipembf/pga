import { classRepository } from "../../data/repositories/ClassRepository"
import { sessionRepository } from "../../data/repositories/SessionRepository"
import { enrollmentRepository } from "../../data/repositories/EnrollmentRepository"
import { taskRepository } from "../../data/repositories/Admin/TaskRepository"
import { clientContractRepository } from "../../data/repositories/ClientContractRepository"
import { query, where, getDocs } from "firebase/firestore"
import { normalizeDate, formatDate, toISODate } from "../../utils/date"
import { WEEKDAY_SHORT_LABELS } from "../../utils/constants"
import { DashboardRules } from "./domain/DashboardRules"

export const TeacherDashboardService = {

    /**
     * Obtém todos os dados do Dashboard do Professor
     */
    getTeacherData: async (idTenant, idBranch, userId) => {
        // Inicialização de variáveis
        let activeClassesCount = 0;
        let totalCapacity = 0;
        let totalEnrolled = 0;
        let myClasses = [];
        let myclients = [];

        // 1. KPIs de Turmas (Classes do Professor)
        try {
            const allActiveClasses = await classRepository.findActive(idTenant, idBranch);
            myClasses = allActiveClasses.filter(c => c.idStaff === userId);

            activeClassesCount = myClasses.length;

            // Somar capacidade total
            totalCapacity = myClasses.reduce((acc, curr) => acc + (parseInt(curr.maxCapacity) || 0), 0);

            // Buscar alunos matriculados nas turmas do professor (Enrollments Ativos)
            const allActiveEnrollments = await enrollmentRepository.findWhere(idTenant, idBranch, [['status', '==', 'active']]);

            // Filtrar matriculas que pertencem às turmas do professor
            const myClassIds = myClasses.map(c => c.id);
            myclients = allActiveEnrollments.filter(e => myClassIds.includes(e.idClass));

            totalEnrolled = myclients.length;

        } catch (err) {
            console.warn("Erro ao buscar KPIs de turmas:", err);
        }

        const occupancyRate = DashboardRules.calculateRate(totalEnrolled, totalCapacity);

        // 2. Taxa de Conversão (Experimental -> Matrícula)
        let conversionRate = 0;
        let conversionTotal = 0;
        let experimentalTotal = 0;

        try {
            // Janela de análise: últimos 30 dias
            const now = new Date();
            const startCheck = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0);

            // Buscar sessões do professor
            const sessionsDocs = await sessionRepository.findWhere(idTenant, idBranch, [
                ['idStaff', '==', userId],
                ['attendanceRecorded', '==', true]
            ]);

            let experimentalclientsIds = new Set();
            const dateStr = startCheck.toISOString().split('T')[0];

            sessionsDocs.forEach(session => {
                // Filtro de data em memória para robustez
                if (session.sessionDate < dateStr) return;

                const snapshot = session.attendanceSnapshot || [];

                snapshot.forEach(att => {
                    const isExperimental = att.enrollmentType === 'experimental' || att.type === 'experimental' || (att.tag && att.tag.includes('Exp'));
                    if (isExperimental && att.status === 'present') {
                        experimentalclientsIds.add(att.idClient || att.id);
                    }
                });
            });

            experimentalTotal = experimentalclientsIds.size;

            if (experimentalTotal > 0) {
                // Verificar quantos desses alunos possuem matrícula ativa HOJE (independente da data de criação, pois se está ativa é pq converteu)
                // O ideal seria verificar a data de criação ser posterior à aula experimental, mas 'active' já é um bom indicativo de sucesso.
                const allEnrollments = await enrollmentRepository.findWhere(idTenant, idBranch, [['status', '==', 'active']]);

                let convertedCount = 0;
                experimentalclientsIds.forEach(clientId => {
                    const hasActive = allEnrollments.some(e => e.idClient === clientId && e.enrollmentType !== 'experimental');
                    if (hasActive) convertedCount++;
                });

                conversionTotal = convertedCount;
                conversionRate = DashboardRules.calculateRate(convertedCount, experimentalTotal);
            }

        } catch (err) {
            console.warn("Erro ao calcular conversão:", err);
        }

        // 3. Aulas Experimentais Próximas (Lista)
        let upcomingExperimentals = [];
        try {
            const todayStr = toISODate(new Date());
            // Próximas sessões do professor (Filtro por idStaff + memória)
            const allTeacherSessions = await sessionRepository.findWhere(idTenant, idBranch, [
                ['idStaff', '==', userId]
            ]);

            const nextSessions = allTeacherSessions
                .filter(s => s.sessionDate >= todayStr)
                .sort((a, b) => {
                    if (a.sessionDate !== b.sessionDate) return a.sessionDate.localeCompare(b.sessionDate);
                    return (a.startTime || '').localeCompare(b.startTime || '');
                })
                .slice(0, 10);

            if (nextSessions.length === 0) {
                upcomingExperimentals = [];
            } else {
                // Buscar enrollments experimentais ativos na unidade
                const expEnrollments = await enrollmentRepository.findWhere(idTenant, idBranch, [
                    ['status', '==', 'active'],
                    ['enrollmentType', '==', 'experimental']
                ]);

                // Cruzar dados: Enrollment experimental p/ turma X na Data Y?
                // Simplificação: Se tem enrollment experimental ativo na turma da sessão futura, consideramos que vai participar (salvo se tiver data específica).

                nextSessions.forEach(session => {
                    const experimentsInClass = expEnrollments.filter(e => e.idClass === session.idClass);

                    experimentsInClass.forEach(exp => {
                        // Adiciona à lista
                        upcomingExperimentals.push({
                            id: session.id + exp.id,
                            sessionDate: session.sessionDate,
                            startTime: session.startTime,
                            className: session.className || 'Aula', // Precisaria buscar nome da atividade
                            clientName: exp.clientName,
                            status: 'Agendado'
                        });
                    });
                });
            }

            // Ordenar por data
            upcomingExperimentals.sort((a, b) => {
                const dateA = new Date(`${a.sessionDate}T${a.startTime || '00:00'}:00`);
                const dateB = new Date(`${b.sessionDate}T${b.startTime || '00:00'}:00`);
                return dateA - dateB;
            });

            // Limitar a 5 próximos
            upcomingExperimentals = upcomingExperimentals.slice(0, 5);

        } catch (err) {
            console.warn("Erro ao buscar experimentais próximas:", err);
        }

        // 4. Minhas Tarefas (Lista)
        let myTasks = [];
        try {
            const allTasks = await taskRepository.findAll(idTenant, idBranch);

            // Filtrar tarefas pendentes atribuídas ao usuário
            myTasks = allTasks.filter(t => {
                const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
                const isAssigned = assignees.includes(userId);
                const isPending = t.status === 'pending' || t.status === 'in_progress';
                return isAssigned && isPending;
            });

            // Ordenar por data de vencimento (mais urgente primeiro)
            myTasks.sort((a, b) => {
                const now = new Date();
                const farFuture = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
                const dateA = a.dueDate ? normalizeDate(a.dueDate) : farFuture;
                const dateB = b.dueDate ? normalizeDate(b.dueDate) : farFuture;
                return dateA - dateB;
            });

            myTasks = myTasks.slice(0, 5);

        } catch (err) {
            console.warn("Erro ao buscar tarefas:", err);
        }

        // 5. Gráfico de Lotação (Ocupação por Dia da Semana)
        const weeklyOccupancy = {
            labels: WEEKDAY_SHORT_LABELS,
            series: [0, 0, 0, 0, 0, 0, 0]
        };

        try {
            // Agrupar minhas turmas pelo dia da semana (weekday)
            // weekday: 0 (Dom) a 6 (Sáb)
            const occupancyByDay = new Array(7).fill({ capacity: 0, enrolled: 0 });

            // Buscar enrollments de cada turma para calcular ocupação real
            // Já temos 'totalEnrolled' global, mas precisamos por turma.
            // Como já buscamos todos enrollments ativos em 'allActiveEnrollments' (dentro do try 1), podemos reutilizar se escopo permitir.
            // Melhor: Iterar sobre 'myClasses' e contar enrollments usando repository findByClass (cacheado se possível).

            // Resetamos occupancyByDay com objetos mutáveis
            // OBS: Array(7).fill({}) cria referências para o mesmo objeto!
            for (let i = 0; i < 7; i++) occupancyByDay[i] = { capacity: 0, enrolled: 0 };

            await Promise.all(myClasses.map(async (cls) => {
                const wd = parseInt(cls.weekday);
                if (wd >= 0 && wd <= 6) {
                    const clientsInClass = await enrollmentRepository.findByClass(idTenant, idBranch, cls.id);
                    const activeclients = clientsInClass.filter(s => s.status === 'active').length;

                    occupancyByDay[wd].capacity += (parseInt(cls.maxCapacity) || 0);
                    occupancyByDay[wd].enrolled += activeclients;
                }
            }));

            // Calcular % via Domínio
            weeklyOccupancy.series = occupancyByDay.map(d => {
                return Math.round(DashboardRules.calculateRate(d.enrolled, d.capacity));
            });

        } catch (err) {
            console.warn("Erro ao calcular gráfico de lotação:", err);
        }

        // 6. Renovações Próximas (Meus Alunos)
        let renewalsCount = 0;
        let renewalsList = [];
        // 7. Histórico de Renovações (Gráfico 6 meses)
        let renewalHistory = {
            labels: [],
            series: []
        };

        try {
            // ----- PARTE 6: Renovações Próximas  -----
            // Identificar IDs dos meus alunos a partir dos enrollments ativos
            const myActiveclientIds = [...new Set(myclients.map(s => s.idClient))];

            if (myActiveclientIds.length > 0) {
                const allActiveContracts = await clientContractRepository.findStrictlyActive(idTenant, idBranch);

                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                const next30Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 23, 59, 59, 999);

                const myExpiringContracts = allActiveContracts.filter(c => {
                    const endDate = normalizeDate(c.endDate);
                    const isMyclient = myActiveclientIds.includes(c.idClient);
                    const isExpiringSoon = endDate >= today && endDate <= next30Days;

                    return isMyclient && isExpiringSoon;
                });

                renewalsCount = myExpiringContracts.length;
                renewalsList = myExpiringContracts.map(c => {
                    const now = new Date();
                    const endDate = normalizeDate(c.endDate);
                    const diffTime = endDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    return {
                        id: c.id,
                        clientName: c.clientName || 'Aluno',
                        planName: c.planName || 'Plano',
                        endDate: formatDate(c.endDate),
                        daysRemaining: diffDays
                    };
                }).sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 5);
            }

            // ----- PARTE 7: Histórico de Renovações -----
            // Estratégia:
            // 1. Buscar TODOS os alunos que JÁ passaram pelo professor (Enrollments ativos e inativos)
            const allMyEnrollments = await enrollmentRepository.findWhere(idTenant, idBranch, []); // Traz tudo e filtra em memória p/ evitar muitas reads se possível, ou filtrar por turmas se der
            // Melhor filtrar em memória pois findWhere [] traz tudo
            const myClassIds = myClasses.map(c => c.id);
            const historicalclients = allMyEnrollments.filter(e => myClassIds.includes(e.idClass));
            const historicalclientIds = [...new Set(historicalclients.map(s => s.idClient))];

            if (historicalclientIds.length > 0) {
                const now = new Date();
                const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
                const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

                // Buscar contratos que VENCERAM nessa janela
                // Precisamos acessar a collection diretamente para query de data
                const contractsRef = clientContractRepository.getCollectionRef(idTenant, idBranch);
                const qExpired = query(
                    contractsRef,
                    where('endDate', '>=', sixMonthsAgo),
                    where('endDate', '<=', endOfCurrentMonth)
                );
                const expiredSnap = await getDocs(qExpired);
                const expiredContracts = [];
                expiredSnap.forEach(d => expiredContracts.push({ id: d.id, ...d.data() }));

                const monthBuckets = {};
                // Inicializar buckets (6 meses)

                for (let i = 0; i < 6; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthKey = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                    monthBuckets[monthKey] = { expired: 0, renewed: 0 };
                }

                // Para verificar renovação, precisamos saber se o aluno tem OUTRO contrato começando DEPOIS
                // Simplificação: Vamos buscar TODOS os contratos dos alunos que tiveram vencimento na janela.
                // Se eles têm um contrato 'active' ou 'future' com startDate >= expiredDate, é renovação.
                const affectedclientIds = [...new Set(expiredContracts.filter(c => historicalclientIds.includes(c.idClient)).map(c => c.idClient))];
                let allclientContracts = [];

                if (affectedclientIds.length > 0) {
                    // Busca contracts de todos esses alunos. Como "in" tem limite de 10, e pode ser muitos, melhor buscar active e cruzar?
                    // Ou buscar tudo da unidade (já temos allActiveContracts da Parte 6, mas precisamos de inativos tb para histórico completo... mas renovação geralmente vira Ativo).
                    // Vamos usar allActiveContracts para check de "Renovou?"
                    // E contratos futuros?
                    const allContractsRef = await clientContractRepository.findAll(idTenant, idBranch); // Pesado? Se tiver muitos contratos...
                    allclientContracts = allContractsRef.filter(c => affectedclientIds.includes(c.idClient));
                }

                expiredContracts.forEach(contract => {
                    if (!historicalclientIds.includes(contract.idClient)) return;

                    const endD = normalizeDate(contract.endDate);
                    const monthKey = `${String(endD.getMonth() + 1).padStart(2, '0')}/${endD.getFullYear()}`;

                    if (monthBuckets[monthKey]) {
                        monthBuckets[monthKey].expired++;

                        const hasRenewal = allclientContracts.some(other => {
                            if (other.id === contract.id) return false;
                            const startD = normalizeDate(other.startDate);
                            // Tolerância de -60 dias (renovou antes de acabar) até +60 dias (renovou depois)
                            const diffTime = startD.getTime() - endD.getTime();
                            const diffDays = diffTime / (1000 * 60 * 60 * 24);
                            return other.idClient === contract.idClient && diffDays >= -60 && diffDays <= 60; // Janela flexível de renovação
                        });

                        if (hasRenewal) {
                            monthBuckets[monthKey].renewed++;
                        }
                    }
                });

                // Formatar para Chart
                const sortedMonths = Object.keys(monthBuckets).sort((a, b) => {
                    const [monthA, yearA] = a.split('/').map(Number);
                    const [monthB, yearB] = b.split('/').map(Number);
                    return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
                });

                renewalHistory.labels = sortedMonths;
                renewalHistory.series = [
                    { name: 'Vencidos', data: sortedMonths.map(m => monthBuckets[m].expired) },
                    { name: 'Renovados', data: sortedMonths.map(m => monthBuckets[m].renewed) },
                    { name: 'Taxa (%)', data: sortedMonths.map(m => monthBuckets[m].expired > 0 ? ((monthBuckets[m].renewed / monthBuckets[m].expired) * 100).toFixed(1) : 0) }
                ];
            }

        } catch (err) {
            console.warn("Erro ao calcular renovações:", err);
        }

        return {
            kpi: {
                activeClasses: activeClassesCount,
                maxCapacity: totalCapacity,
                activeclients: totalEnrolled,
                occupancyRate,
                conversionRate,
                conversionTotal,
                experimentalTotal,
                renewalsCount
            },
            lists: {
                upcomingExperimentals,
                myTasks,
                renewalsList
            },
            charts: {
                weeklyOccupancy,
                renewalHistory
            }
        };
    }
}
