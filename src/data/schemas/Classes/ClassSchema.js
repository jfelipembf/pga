import * as Yup from 'yup'

/**
 * Esquema para criação de uma Grade de Aulas (uma ou mais turmas por dia)
 */
export const CreateGradeSchema = Yup.object().shape({
    idActivity: Yup.string().required('Atividade é obrigatória'),
    idArea: Yup.string().required('Local/Área é obrigatório'),
    idStaff: Yup.string().required('Instrutor/Professor é obrigatório'),
    weekdays: Yup.array().of(Yup.number()).min(1, 'Selecione ao menos um dia da semana'),
    startTime: Yup.string().required('Horário de início é obrigatório'),
    endTime: Yup.string().required('Horário de término é obrigatório'),
    startDate: Yup.string()
        .required('Data de início é obrigatória')
        .test('max-year', 'O ano não pode ser maior que 2100', value => {
            if (!value) return true;
            const year = parseInt(value.split('-')[0]);
            return year <= 2100;
        }),
    endDate: Yup.string()
        .nullable()
        .notRequired()
        .test('max-year', 'O ano não pode ser maior que 2100', value => {
            if (!value) return true;
            const year = parseInt(value.split('-')[0]);
            return year <= 2100;
        }),
    maxCapacity: Yup.number().positive('A capacidade deve ser positiva').required('Capacidade é obrigatória'),
    isActive: Yup.boolean().default(true),
})

/**
 * Esquema individual para o documento na coleção 'classes'
 */
export const ClassSchema = Yup.object().shape({
    idActivity: Yup.string().required(),
    idArea: Yup.string().required(),
    idStaff: Yup.string().required(),
    weekday: Yup.number().required(),
    startTime: Yup.string().required(),
    endTime: Yup.string().required(),
    durationMinutes: Yup.number().required(),
    maxCapacity: Yup.number().required(),
    startDate: Yup.string()
        .required()
        .test('max-year', value => {
            if (!value) return true;
            const year = parseInt(value.split('-')[0]);
            return year <= 2100;
        }),
    endDate: Yup.string()
        .nullable()
        .notRequired()
        .test('max-year', value => {
            if (!value) return true;
            const year = parseInt(value.split('-')[0]);
            return year <= 2100;
        }),
    isActive: Yup.boolean().default(true),
    status: Yup.string().default('active'),
})

/**
 * Esquema individual para o documento na coleção 'sessions'
 */
export const SessionSchema = Yup.object().shape({
    idClass: Yup.string().required(),
    idActivity: Yup.string().required(),
    idArea: Yup.string().required(),
    idStaff: Yup.string().required(),
    sessionDate: Yup.string().required(), // YYYY-MM-DD
    startTime: Yup.string().required(),
    endTime: Yup.string().required(),
    durationMinutes: Yup.number().required(),
    weekday: Yup.number().required(),
    maxCapacity: Yup.number().required(),
    enrolledCount: Yup.number().default(0),
    trialCount: Yup.number().default(0),
    presentCount: Yup.number().default(0),
    absentCount: Yup.number().default(0),
    attendanceRecorded: Yup.boolean().default(false),
    status: Yup.string().default('scheduled'),
    isActive: Yup.boolean().default(true),
})
