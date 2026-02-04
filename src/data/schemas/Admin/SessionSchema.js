import * as Yup from 'yup';

/**
 * Esquema de validação para Sessões (Sessions).
 */
export const SessionSchema = Yup.object().shape({
    idActivity: Yup.string().required('Atividade é obrigatória'),
    idArea: Yup.string().required('Área/Sala é obrigatória'),
    idStaff: Yup.string().required('Professor/Instrutor é obrigatório'),
    sessionDate: Yup.string().required('Data é obrigatória'),
    startTime: Yup.string().required('Horário de início é obrigatório'),
    endTime: Yup.string().required('Horário de término é obrigatório'),
    maxCapacity: Yup.number().positive().integer().required('Capacidade é obrigatória'),
    enrolledCount: Yup.number().min(0).default(0),
    isActive: Yup.boolean().default(true),
    status: Yup.string().oneOf(['active', 'cancelled', 'completed']).default('active'),
    attendanceRecorded: Yup.boolean().default(false),
    attendanceSnapshot: Yup.array().of(Yup.object()).nullable().default(null)
});
