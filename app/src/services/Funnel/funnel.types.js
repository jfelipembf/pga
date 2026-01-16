export const FUNNEL_STEPS = {
    LEAD: 'lead',
    EXPERIMENTAL_SCHEDULED: 'experimental_scheduled',
    EXPERIMENTAL_ATTENDED: 'experimental_attended',
    EXPERIMENTAL_CANCELLED: 'experimental_cancelled',
    CONVERSION: 'conversion'
}

export const FUNNEL_EVENTS = {
    [FUNNEL_STEPS.LEAD]: 'lead_created',
    [FUNNEL_STEPS.EXPERIMENTAL_SCHEDULED]: 'class_scheduled',
    [FUNNEL_STEPS.EXPERIMENTAL_ATTENDED]: 'class_attended',
    [FUNNEL_STEPS.EXPERIMENTAL_CANCELLED]: 'class_cancelled',
    [FUNNEL_STEPS.CONVERSION]: 'contract_signed'
}

export const FUNNEL_FIELDS = {
    ID: 'id',
    TYPE: 'type', // One of FUNNEL_STEPS
    EVENT_NAME: 'eventName', // One of FUNNEL_EVENTS
    CLIENT_ID: 'clientId',
    TIMESTAMP: 'timestamp', // ISO string

    // Context fields (Future Proofing)
    INSTRUCTOR_ID: 'instructorId',
    INSTRUCTOR_NAME: 'instructorName',
    SALES_REP_ID: 'salesRepId', // Consultor
    SALES_REP_NAME: 'salesRepName',

    // Operational Links
    CLASS_ID: 'classId',
    SESSION_ID: 'sessionId',
    SALE_ID: 'saleId',
    CONTRACT_ID: 'contractId',

    // Metadata
    CREATED_AT: 'createdAt',
    CREATED_BY: 'createdBy'
}
