import { classRepository } from "../../data/repositories/ClassRepository"
import { sessionRepository } from "../../data/repositories/SessionRepository"
import { enrollmentRepository } from "../../data/repositories/EnrollmentRepository"
import { taskRepository } from "../../data/repositories/Admin/TaskRepository"
import { clientContractRepository } from "../../data/repositories/ClientContractRepository"
import { query, where, getDocs } from "firebase/firestore"
import moment from "moment"
import { normalizeDate } from "../../utils/date"

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
        let myStudents = [];

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
            myStudents = allActiveEnrollments.filter(e => myClassIds.includes(e.idClass));

            totalEnrolled = myStudents.length;

        } catch (err) {
            console.warn("Erro ao buscar KPIs de turmas:", err);
        }

        const occupancyRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

        // 2. Taxa de Conversão (Experimental -> Matrícula)
        let conversionRate = 0;
        let conversionTotal = 0;
        let experimentalTotal = 0;

        try {
            // Janela de análise: últimos 30 dias
            const startCheck = normalizeDate(moment().subtract(30, 'days').startOf('day'));

            // Buscar sessões do professor (Filtro simples por idStaff para evitar índices compostos com datas)
            const sessionsDocs = await sessionRepository.findWhere(idTenant, idBranch, [
                ['idStaff', '==', userId],
                ['attendanceRecorded', '==', true]
            ]);

            let experimentalStudentsIds = new Set();
            const dateStr = startCheck.toISOString().split('T')[0];

            sessionsDocs.forEach(session => {
                // Filtro de data em memória para robustez
                if (session.sessionDate < dateStr) return;

                const snapshot = session.attendanceSnapshot || [];

                snapshot.forEach(att => {
                    const isExperimental = att.enrollmentType === 'experimental' || att.type === 'experimental' || (att.tag && att.tag.includes('Exp'));
                    if (isExperimental && att.status === 'present') {
                        experimentalStudentsIds.add(att.idClient || att.id);
                    }
                });
            });

            experimentalTotal = experimentalStudentsIds.size;

            if (experimentalTotal > 0) {
                // Verificar quantos desses alunos possuem matrícula ativa HOJE (independente da data de criação, pois se está ativa é pq converteu)
                // O ideal seria verificar a data de criação ser posterior à aula experimental, mas 'active' já é um bom indicativo de sucesso.
                const allEnrollments = await enrollmentRepository.findWhere(idTenant, idBranch, [['status', '==', 'active']]);

                let convertedCount = 0;
                experimentalStudentsIds.forEach(studentId => {
                    const hasActive = allEnrollments.some(e => e.idClient === studentId && e.enrollmentType !== 'experimental');
                    if (hasActive) convertedCount++;
                });

                conversionTotal = convertedCount;
                conversionRate = (convertedCount / experimentalTotal) * 100;
            }

        } catch (err) {
            console.warn("Erro ao calcular conversão:", err);
        }

        // 3. Aulas Experimentais Próximas (Lista)
        let upcomingExperimentals = [];
        try {
            const todayStr = moment().format('YYYY-MM-DD');
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
                            studentName: exp.clientName,
                            status: 'Agendado'
                        });
                    });
                });
            }

            // Ordenar por data
            upcomingExperimentals.sort((a, b) => {
                const dateA = moment(`${a.sessionDate} ${a.startTime}`);
                const dateB = moment(`${b.sessionDate} ${b.startTime}`);
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
                const dateA = a.dueDate ? moment(a.dueDate.toDate ? a.dueDate.toDate() : a.dueDate) : moment().add(10, 'years');
                const dateB = b.dueDate ? moment(b.dueDate.toDate ? b.dueDate.toDate() : b.dueDate) : moment().add(10, 'years');
                return dateA - dateB;
            });

            myTasks = myTasks.slice(0, 5);

        } catch (err) {
            console.warn("Erro ao buscar tarefas:", err);
        }

        // 5. Gráfico de Lotação (Ocupação por Dia da Semana)
        const weeklyOccupancy = {
            labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
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
                    const studentsInClass = await enrollmentRepository.findByClass(idTenant, idBranch, cls.id);
                    const activeStudents = studentsInClass.filter(s => s.status === 'active').length;

                    occupancyByDay[wd].capacity += (parseInt(cls.maxCapacity) || 0);
                    occupancyByDay[wd].enrolled += activeStudents;
                }
            }));

            // Calcular %
            weeklyOccupancy.series = occupancyByDay.map(d => {
                return d.capacity > 0 ? Math.round((d.enrolled / d.capacity) * 100) : 0;
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
            const myActiveStudentIds = [...new Set(myStudents.map(s => s.idClient))];

            if (myActiveStudentIds.length > 0) {
                const allActiveContracts = await clientContractRepository.findStrictlyActive(idTenant, idBranch);

                const today = moment();
                const next30Days = moment().add(30, 'days');

                const myExpiringContracts = allActiveContracts.filter(c => {
                    const endDate = c.endDate?.toDate ? moment(c.endDate.toDate()) : moment(c.endDate);
                    const isMyStudent = myActiveStudentIds.includes(c.idClient);
                    const isExpiringSoon = endDate.isSameOrAfter(today, 'day') && endDate.isSameOrBefore(next30Days, 'day');

                    return isMyStudent && isExpiringSoon;
                });

                renewalsCount = myExpiringContracts.length;
                renewalsList = myExpiringContracts.map(c => ({
                    id: c.id,
                    studentName: c.clientName || 'Aluno',
                    planName: c.planName || 'Plano',
                    endDate: c.endDate?.toDate ? moment(c.endDate.toDate()).format('DD/MM/YYYY') : moment(c.endDate).format('DD/MM/YYYY'),
                    daysRemaining: c.endDate?.toDate ? moment(c.endDate.toDate()).diff(today, 'days') : moment(c.endDate).diff(today, 'days')
                })).sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 5);
            }

            // ----- PARTE 7: Histórico de Renovações -----
            // Estratégia:
            // 1. Buscar TODOS os alunos que JÁ passaram pelo professor (Enrollments ativos e inativos)
            const allMyEnrollments = await enrollmentRepository.findWhere(idTenant, idBranch, []); // Traz tudo e filtra em memória p/ evitar muitas reads se possível, ou filtrar por turmas se der
            // Melhor filtrar em memória pois findWhere [] traz tudo
            const myClassIds = myClasses.map(c => c.id);
            const historicalStudents = allMyEnrollments.filter(e => myClassIds.includes(e.idClass));
            const historicalStudentIds = [...new Set(historicalStudents.map(s => s.idClient))];

            if (historicalStudentIds.length > 0) {
                const sixMonthsAgo = moment().subtract(5, 'months').startOf('month'); // 5 meses atrás + atual = 6
                const endOfCurrentMonth = moment().endOf('month');

                // Buscar contratos que VENCERAM nessa janela
                // Precisamos acessar a collection diretamente para query de data
                const contractsRef = clientContractRepository.getCollectionRef(idTenant, idBranch);
                const qExpired = query(
                    contractsRef,
                    where('endDate', '>=', sixMonthsAgo.toDate()),
                    where('endDate', '<=', endOfCurrentMonth.toDate())
                );
                const expiredSnap = await getDocs(qExpired);
                const expiredContracts = [];
                expiredSnap.forEach(d => expiredContracts.push({ id: d.id, ...d.data() }));

                // Agrupar por mês
                const monthBuckets = {};
                // Inicializar buckets
                for (let i = 0; i < 6; i++) {
                    const m = moment().subtract(i, 'months');
                    monthBuckets[m.format('MM/YYYY')] = { expired: 0, renewed: 0 };
                }

                // Para verificar renovação, precisamos saber se o aluno tem OUTRO contrato começando DEPOIS
                // Simplificação: Vamos buscar TODOS os contratos dos alunos que tiveram vencimento na janela.
                // Se eles têm um contrato 'active' ou 'future' com startDate >= expiredDate, é renovação.
                const affectedStudentIds = [...new Set(expiredContracts.filter(c => historicalStudentIds.includes(c.idClient)).map(c => c.idClient))];
                let allStudentContracts = [];

                if (affectedStudentIds.length > 0) {
                    // Busca contracts de todos esses alunos. Como "in" tem limite de 10, e pode ser muitos, melhor buscar active e cruzar?
                    // Ou buscar tudo da unidade (já temos allActiveContracts da Parte 6, mas precisamos de inativos tb para histórico completo... mas renovação geralmente vira Ativo).
                    // Vamos usar allActiveContracts para check de "Renovou?"
                    // E contratos futuros?
                    const allContractsRef = await clientContractRepository.findAll(idTenant, idBranch); // Pesado? Se tiver muitos contratos...
                    allStudentContracts = allContractsRef.filter(c => affectedStudentIds.includes(c.idClient));
                }

                expiredContracts.forEach(contract => {
                    if (!historicalStudentIds.includes(contract.idClient)) return;

                    const endD = contract.endDate?.toDate ? moment(contract.endDate.toDate()) : moment(contract.endDate);
                    const monthKey = endD.format('MM/YYYY');

                    if (monthBuckets[monthKey]) {
                        monthBuckets[monthKey].expired++;

                        // Check de renovação: Existe contrato (diferente deste) para o mesmo aluno começando >= data fim?
                        const hasRenewal = allStudentContracts.some(other => {
                            if (other.id === contract.id) return false;
                            const startD = other.startDate?.toDate ? moment(other.startDate.toDate()) : moment(other.startDate);
                            // Tolerância de -30 dias (renovou antes de acabar) até +30 dias (renovou depois)
                            const diffDays = startD.diff(endD, 'days');
                            return other.idClient === contract.idClient && diffDays >= -60 && diffDays <= 60; // Janela flexível de renovação
                        });

                        if (hasRenewal) {
                            monthBuckets[monthKey].renewed++;
                        }
                    }
                });

                // Formatar para Chart
                const sortedMonths = Object.keys(monthBuckets).sort((a, b) => moment(a, 'MM/YYYY') - moment(b, 'MM/YYYY'));

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
                activeStudents: totalEnrolled,
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
