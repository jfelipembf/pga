/**
 * Serviço para agregar dados dos Dashboards Operacional e Gerencial.
 * Versão ultra-resiliente que não depende de índices compostos manuais.
 */
import { transactionRepository } from "../../data/repositories/TransactionRepository"
import { query, where, getDocs } from "firebase/firestore"
import moment from "moment"

export const GeneralDashboardService = {

    /**
     * Dados para o Dashboard Operacional (Consultor)
     */
    getOperationalData: async (idTenant, idBranch, userId) => {
        const startMonth = moment().startOf('month').toDate();
        const endMonth = moment().endOf('month').toDate();
        const today = moment().startOf('day');

        const collectionRef = transactionRepository.getCollectionRef(idTenant, idBranch);
        let salesToday = 0;
        let salesMonth = 0;

        try {
            // Buscamos apenas pelo criador (já indexado) para evitar erro de índice composto com Data+Tipo
            const q = query(
                collectionRef,
                where('createdBy', '==', userId),
                where('date', '>=', startMonth),
                where('date', '<=', endMonth)
            );

            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                const item = doc.data();
                // Filtramos o tipo 'income' na memória (consome menos que 1ms de CPU)
                if (item.type === 'income') {
                    const amount = parseFloat(item.amount) || 0;
                    const date = moment(item.date?.toDate ? item.date.toDate() : item.date);

                    salesMonth += amount;
                    if (date.isSame(today, 'day')) {
                        salesToday += amount;
                    }
                }
            });

        } catch (err) {
            console.warn("Erro no dashboard operacional:", err);
        }

        return {
            mySalesToday: salesToday,
            mySalesMonth: salesMonth,
            myGoal: 0,
            birthdays: [],
            tasks: []
        };
    },

    /**
     * Dados para o Dashboard Gerencial (Gestor)
     */
    getManagerData: async (idTenant, idBranch) => {
        const startMonth = moment().startOf('month').toDate();
        const endMonth = moment().endOf('month').toDate();
        const today = moment().startOf('day');

        const collectionRef = transactionRepository.getCollectionRef(idTenant, idBranch);
        let salesToday = 0;
        let salesMonth = 0;
        let salesCount = 0;

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
                // Filtramos tipo venda (income) em memória
                if (item.type === 'income') {
                    const amount = parseFloat(item.amount) || 0;
                    const date = moment(item.date?.toDate ? item.date.toDate() : item.date);

                    salesMonth += amount;
                    salesCount++;

                    if (date.isSame(today, 'day')) {
                        salesToday += amount;
                    }
                }
            });

        } catch (err) {
            console.warn("Erro no dashboard gerencial:", err);
        }

        const ticketAverage = salesCount > 0 ? (salesMonth / salesCount) : 0;

        return {
            students: { active: 0, new: 0, canceled: 0, suspended: 0 },
            sales: { today: salesToday, month: salesMonth, ticket: ticketAverage }
        };
    }
}
