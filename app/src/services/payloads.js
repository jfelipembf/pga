/**
 * ENTITY PAYLOAD BUILDERS
 * 
 * Centraliza a definição dos objetos de dados para garantir consistência
 * nos nomes dos campos (ex: idClient vs id) e evitar conversões repetidas.
 */


// ============================================================================
// CLIENT
// ============================================================================

export const ClientStatus = {
    LEAD: 'lead',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BLOCKED: 'blocked'
}

/**
 * Monta o payload para criação/atualização de Cliente.
 * @param {object} data
 */
export const buildClientPayload = (data) => {
    const {
        firstName,
        lastName,
        name,
        email,
        phone,
        birthDate,
        gender,
        document,
        status,
        funnel // Funnel state
    } = data

    // Garante nome completo
    const fullName = name || [firstName, lastName].filter(Boolean).join(" ").trim()

    return {
        firstName: firstName || "",
        lastName: lastName || "",
        name: fullName,
        email: email || "",
        phone: phone || "",
        birthDate: birthDate || null,
        gender: gender || "",
        document: document || "",
        address: buildAddress(data),
        photo: data.photo || "",
        status: status || ClientStatus.LEAD,
        funnel: funnel || {}
    }
}

// Helper para construir objeto de endereço padronizado
const buildAddress = (data) => {
    // Se o dado de entrada já tiver address como objeto, usa ele como base
    // Caso contrário, usa o próprio data (flat)
    let source = data
    let street = ""

    if (data.address && typeof data.address === 'object') {
        source = { ...data, ...data.address }
        street = source.street || source.address || "" // Tenta street, fallback para address(string)
    } else {
        street = data.street || data.address || ""
    }

    // Se street for objeto (erro de dados antigos), força string vazia
    if (typeof street === 'object') street = ""

    return {
        street: street,
        number: source.number || "",
        complement: source.complement || "",
        neighborhood: source.neighborhood || "",
        city: source.city || "",
        state: source.state || "",
        zip: source.zip || "" // CEP
    }
}

// ============================================================================
// ENROLLMENT (Matrícula)
// ============================================================================

export const EnrollmentType = {
    RECURRING: 'recurring',
    EXPERIMENTAL: 'experimental',
    SINGLE: 'single-session'
}

export const EnrollmentStatus = {
    ACTIVE: 'active',
    CANCELED: 'canceled',
    COMPLETED: 'completed'
}

/**
 * Monta o payload para Matrícula.
 */
export const buildEnrollmentPayload = (data) => {
    return {
        idClient: data.idClient, // MANDATORY
        idClass: data.idClass || null,
        idSession: data.idSession || null,
        idActivity: data.idActivity || null,
        type: data.type || EnrollmentType.RECURRING,
        status: data.status || EnrollmentStatus.ACTIVE,

        // Data definitions
        startDate: data.startDate || new Date().toISOString(),
        endDate: data.endDate || null,
        sessionDate: data.sessionDate || null, // For single/experimental

        // Snapshot data (for history)
        clientName: data.clientName || "",
        activityName: data.activityName || "",
        className: data.className || "",

        // Responsible Staff (who scheduled/manages)
        idStaff: data.idStaff || null,
        staffName: data.staffName || "",

        // Instructor Snapshot (who teaches)
        instructorId: data.instructorId || null,
        instructorName: data.instructorName || "",

        // Time Snapshot
        startTime: data.startTime || null,
        endTime: data.endTime || null
    }
}

// ============================================================================
// CLIENT CONTRACT (Contrato/Venda)
// ============================================================================



// ============================================================================
// STAFF
// ============================================================================

export const StaffRole = {
    ADMIN: 'admin',
    INSTRUCTOR: 'instructor',
    RECEPTIONIST: 'receptionist',
    SALES: 'sales'
}

export const buildStaffPayload = (data) => {
    return {
        id: data.id,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        name: data.name || [data.firstName, data.lastName].filter(Boolean).join(" ").trim(),
        email: data.email || "",
        phone: data.phone || "",
        document: data.document || data.cpf || "", // Standardized to document
        address: buildAddress(data), // Added address

        role: data.role || StaffRole.INSTRUCTOR,
        roleId: data.roleId || null, // NEW: ID-driven link
        isInstructor: !!data.isInstructor,
        active: data.active !== false, // Default true
        photo: data.photo || "",

        // Dates
        birthDate: data.birthDate || null,
        hiringDate: data.hiringDate || null
    }
}

// ============================================================================
// CLASS (Turma)
// ============================================================================

export const buildClassPayload = (data) => {
    return {
        idActivity: data.idActivity || null, // MANDATORY
        idStaff: data.idStaff || null,
        idArea: data.idArea || null,

        name: data.name || "Turma", // Optional override

        // Schedule
        weekday: data.weekday ?? null, // 0-6
        weekDays: Array.isArray(data.weekDays) ? data.weekDays : [], // Optional multiple days
        startTime: data.startTime || "", // "HH:mm"
        endTime: data.endTime || "",
        durationMinutes: Number(data.durationMinutes || 60),

        // Capacity
        maxCapacity: Number(data.maxCapacity || data.capacity || 20),

        // Config
        active: data.active !== false,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
    }
}

// ============================================================================
// SALE (Venda)
// ============================================================================

export const buildSalePayload = (data) => {
    return {
        idClient: data.idClient,
        clientName: data.clientName || "", // Added for audit enrichment
        idSeller: data.idSeller || data.salesRepId || null,
        idStaff: data.idStaff || null,
        staffName: data.staffName || "",

        // Status
        status: data.status || 'open',

        // Totals (Original fields)
        grossAmount: Number(data.grossAmount || data.amount || 0),
        discountAmount: Number(data.discountAmount || 0),
        netAmount: Number(data.netAmount || data.amount || 0),

        // New Totals Object (for backend compatibility)
        totals: data.totals || null,

        // Items and Payments
        items: Array.isArray(data.items) ? data.items : [],
        payments: Array.isArray(data.payments) ? data.payments : [],

        // Dates
        date: data.date || new Date().toISOString(),
        dueDate: data.dueDate || null,

        // Metadata
        origin: data.origin || 'manual'
    }
}

// ============================================================================
// FINANCIAL (Transações)
// ============================================================================

export const TransactionType = {
    SALE: 'sale',
    EXPENSE: 'expense'
}

export const buildFinancialTransactionPayload = (data) => {
    return {
        amount: Number(data.amount || 0),
        type: data.type || TransactionType.SALE,
        category: data.category || 'Geral',
        description: data.description || "",

        // Payment info
        method: data.method || 'cash', // cash, credit_card, etc
        installments: Number(data.installments || 1),

        // Dates
        date: data.date || new Date().toISOString(),
        dueDate: data.dueDate || null,
        paidAt: data.paidAt || null,

        // Relations
        idClient: data.idClient || null,
        idSale: data.idSale || null,
        idStaff: data.idStaff || null,

        // Status
        status: data.status || 'paid'
    }
}

// ============================================================================
// ACTIVITY (Atividade)
// ============================================================================

export const buildActivityPayload = (data) => {
    return {
        name: data.name || "Nova Atividade",
        description: data.description || "",
        color: data.color || "#3c5068",
        status: data.status || "ativo",

        // Instructor override for entire activity
        idStaff: data.idStaff || data.idInstructor || data.instructorId || null,
        instructor: data.instructor || null, // Optional denormalized name

        // Configs
        maxCapacity: Number(data.maxCapacity || data.capacity || 20),
        durationMinutes: Number(data.durationMinutes || 60),

        active: data.active !== false,
        deleted: false,
        photo: data.photo || ""
    }
}


// ============================================================================
// CATALOG (Produtos e Serviços)
// ============================================================================

export const buildProductPayload = (data) => {
    return {
        name: data.name || "Produto",
        description: data.description || "",
        price: Number(data.price || 0),
        cost: Number(data.cost || 0),
        sku: data.sku || "",
        barcode: data.barcode || "",
        stock: Number(data.stock || 0),
        category: data.category || "Geral",
        active: data.active !== false,
        photo: data.photo || ""
    }
}

export const buildServicePayload = (data) => {
    return {
        name: data.name || "Serviço",
        description: data.description || "",
        price: Number(data.price || 0),
        durationMinutes: Number(data.durationMinutes || 60),
        category: data.category || "Geral",
        active: data.active !== false,
        photo: data.photo || ""
    }
}

// ============================================================================
// EVENT (Eventos de Calendário/Avaliação)
// ============================================================================

export const EventType = {
    EVALUATION: 'avaliacao',
    HOLIDAY: 'feriado',
    OTHER: 'outros'
}

export const buildEventPayload = (data) => {
    return {
        title: data.title || "Evento",
        description: data.description || "",
        type: data.type || EventType.OTHER,

        // Date Range
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate || data.startDate || new Date().toISOString().split('T')[0],

        // Relations
        idArea: data.idArea || null,

        // Test Specifics
        testType: data.testType || null,
        distanceMeters: Number(data.distanceMeters || 0),
        targetTime: data.targetTime || null,
        styles: data.styles || "",

        active: data.active !== false,
        photo: data.photo || ""
    }
}

/**
 * ==========================================================
 * CONTRACTS (CATALOG TEMPLATES)
 * ==========================================================
 */
export const buildContractPayload = (data) => {
    return {
        // Identification
        title: data.title || "",
        status: data.status || "active",
        duration: Number(data.duration || 0),
        durationType: data.durationType || "Meses",
        minPeriodStayMembership: Number(data.minPeriodStayMembership || 0),

        // Enrollment Rules
        requiresEnrollment: Boolean(data.requiresEnrollment),
        maxWeeklyEnrollments: Number(data.maxWeeklyEnrollments ?? data.weeklyLimit ?? 0),
        allowedWeekDays: Array.isArray(data.allowedWeekDays) ? data.allowedWeekDays : [],

        // Pricing
        value: Number(data.value || 0),
        maxAmountInstallments: Number(data.maxAmountInstallments || 1),

        // Suspension Rules
        allowSuspension: Boolean(data.allowSuspension),
        suspensionMaxDays: Number(data.suspensionMaxDays || 0),

        // Metadata

    }
}

/**
 * ==========================================================
 * CLIENT CONTRACTS (ACTIVE INSTANCES)
 * ==========================================================
 */
export const buildClientContractPayload = (data) => {
    return {
        // Core Links
        idClient: data.idClient,
        idContract: data.idContract || null, // Template ID
        idSale: data.idSale || null,
        idSaleItem: data.idSaleItem || null,

        // Copy of Template Data (Snapshot)
        contractTitle: data.contractTitle || data.title || "",
        contractCode: data.contractCode || null, // Generated by backend usually

        // Status & Dates (Specific to this instance)
        status: data.status || "active",
        startDate: data.startDate || new Date().toISOString().split("T")[0],
        endDate: data.endDate || null, // Can be null if recurring infinite

        // Enrollment Rules (Snapshot)
        requiresEnrollment: Boolean(data.requiresEnrollment),
        maxWeeklyEnrollments: Number(data.maxWeeklyEnrollments || 0),
        allowedWeekDays: Array.isArray(data.allowedWeekDays) ? data.allowedWeekDays : [],
        enrollmentStatus: data.enrollmentStatus || "pending",

        // Suspension Rules (Snapshot)
        allowSuspension: Boolean(data.allowSuspension),
        suspensionMaxDays: Number(data.suspensionMaxDays || 0),
        totalSuspendedDays: Number(data.totalSuspendedDays || 0),
        pendingSuspensionDays: Number(data.pendingSuspensionDays || 0),

        // Cancellation (If applicable)
        minPeriodStayMembership: Number(data.minPeriodStayMembership || 0),

        // Display / Utils
        billing: data.billing || "--",
        balanceDays: Number(data.balanceDays ?? data.daysBalance ?? 0),

        notes: data.notes || "",
    }
}

/**
 * ==========================================================
 * RECEIVABLES (DEBTS)
 * ==========================================================
 */
export const buildReceivablePayload = (data) => {
    return {
        // Link to Source
        idClient: data.idClient,
        clientName: data.clientName || "", // Added for audit enrichment
        idSale: data.idSale || null,
        idContract: data.idContract || null,

        // Value
        amount: Number(data.amount || 0),
        balance: Number(data.balance !== undefined ? data.balance : data.amount || 0), // Remaining to pay

        // Dates
        dueDate: data.dueDate || new Date().toISOString().split("T")[0],
        paidAt: null,

        // Status
        status: data.status || "open", // open, paid, canceled, late

        // Details
        description: data.description || "Saldo Devedor",

        // Extended (Optional but useful for centralizing)
        paymentType: data.paymentType || null,
        competenceDate: data.competenceDate || data.dueDate || new Date().toISOString().split("T")[0],
    }
}

/**
 * ==========================================================
 * CLIENT DEBTS (SUBCOLLECTION)
 * ==========================================================
 */
export const buildClientDebtPayload = (data) => {
    return {
        idReceivable: data.idReceivable || data.id || null, // Global ID
        idSale: data.idSale || null,

        amount: Number(data.amount || 0),
        balance: Number(data.balance !== undefined ? data.balance : data.amount || 0),

        dueDate: data.dueDate || new Date().toISOString().split("T")[0],
        status: data.status || "open",
        description: data.description || "Dívida",

        createdAt: data.createdAt || null,
    }
}
