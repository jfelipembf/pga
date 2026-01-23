/**
 * Core Logic & Data Definitions (Shared between Front and Back)
 */

const { AddressSchema, buildAddress } = require("./address");
const {
    deriveFullName,
    // Currency utilities
    formatCurrency, formatCurrencyAbs,
    // String utilities
    capitalizeWords, capitalizeFirst, normalizeForSearch, normalizeStatus, cleanWhitespace,
    // Math utilities
    calculatePercent, calculateDelta, calculateAverage, formatNumber,
    // Date functions
    toISODate, parseDate, parseFirestoreDate, formatDate, sanitizeDate,
    addDays, getToday, normalizeDate,
    compareDates, isDateBefore, isDateAfterOrEqual, isSameDay,
    toMonthKey, monthRangeFromKey, findFirstWeekdayOnOrAfter, computeEndTime, getStartOfWeekSunday,
    timeToMinutes, minutesToTime,
    getStepForView, formatRangeLabel, formatDayLabel, formatDayHeaderLabel,
    formatDateDisplay, getTodayISO, getThisMonth, getYesterdayISO
} = require("./common");
const { ClassSchema, ClassUpdateSchema, buildClassPayload } = require("./classes");
const { ClientStatus, ClientSchema, buildClientPayload } = require("./clients");
const { StaffRole, StaffSchema, buildStaffPayload } = require("./staff");
const { EnrollmentType, EnrollmentStatus, EnrollmentSchema, buildEnrollmentPayload } = require("./enrollments");
const {
    ReceivableStatus,
    TransactionType,
    PaymentMethod,
    buildReceivablePayload,
    buildTransactionPayload
} = require("./financial");
const {
    ContractStatus,
    DurationType,
    ContractSchema,
    buildContractPayload
} = require("./contracts");

const {
    SaleStatus,
    SaleOrigin,
    SaleItemType,
    SaleSchema,
    buildSalePayload,
    buildSaleItemPayload,
    buildSalePaymentPayload,
    detectSaleType
} = require("./sales");

const {
    ProductSchema,
    ServiceSchema,
    buildProductPayload,
    buildServicePayload
} = require("./catalog");

const {
    ClientContractStatus,
    ClientContractSchema,
    buildClientContractPayload
} = require("./client-contracts");

const {
    EventType,
    EventSchema,
    buildEventPayload
} = require("./events");

const {
    ActivitySchema,
    buildActivityPayload
} = require("./activities");

const {
    ClientDebtSchema,
    buildClientDebtPayload
} = require("./client-debts");

const {
    isPresentStatus,
    calculatePresenceStats,
    calculateClientPresenceCardStats,
    calculateMonthStats,
    countWeekdayOccurrencesInRange,
    calculateExpectedAttendancesFromEnrollments,
    formatComparison
} = require("./attendance");

const {
    PerformanceLogSchema,
    getPerformanceCategory,
    trackPerformance
} = require("./monitoring");

const {
    mapToGridFormat
} = require("./mappers");

module.exports = {
    // Address
    AddressSchema,
    buildAddress,

    // Common
    deriveFullName,

    // Currency utilities
    formatCurrency,
    formatCurrencyAbs,

    // String utilities
    capitalizeWords,
    capitalizeFirst,
    normalizeForSearch,
    normalizeStatus,
    cleanWhitespace,

    // Math utilities
    calculatePercent,
    calculateDelta,
    calculateAverage,
    formatNumber,

    // Date functions
    toISODate,
    parseDate,
    parseFirestoreDate,
    formatDate,
    sanitizeDate,
    addDays,
    getToday,
    normalizeDate,
    compareDates,
    isDateBefore,
    isDateAfterOrEqual,
    isSameDay,
    toMonthKey,
    monthRangeFromKey,
    findFirstWeekdayOnOrAfter,
    computeEndTime,
    getStartOfWeekSunday,
    timeToMinutes,
    minutesToTime,
    getStepForView,
    formatRangeLabel,
    formatDayLabel,
    formatDayHeaderLabel,
    formatDateDisplay,
    getTodayISO,
    getThisMonth,
    getYesterdayISO,

    // Classes
    ClassSchema,
    ClassUpdateSchema,
    buildClassPayload,

    // Clients
    ClientStatus,
    ClientSchema,
    buildClientPayload,

    // Staff
    StaffRole,
    StaffSchema,
    buildStaffPayload,

    // Enrollments
    EnrollmentType,
    EnrollmentStatus,
    EnrollmentSchema,
    buildEnrollmentPayload,

    // Financial
    ReceivableStatus,
    TransactionType,
    PaymentMethod,
    buildReceivablePayload,
    buildTransactionPayload,

    // Contracts
    ContractStatus,
    DurationType,
    ContractSchema,
    ContractSchema,
    buildContractPayload,

    // Sales
    SaleStatus,
    SaleOrigin,
    SaleItemType,
    SaleSchema,
    buildSalePayload,
    buildSaleItemPayload,
    buildSalePaymentPayload,
    detectSaleType,

    // Catalog
    ProductSchema,
    ServiceSchema,
    buildProductPayload,
    buildServicePayload,

    // Client Contracts
    ClientContractStatus,
    ClientContractSchema,
    buildClientContractPayload,

    // Events
    EventType,
    EventSchema,
    buildEventPayload,

    // Activities
    ActivitySchema,
    buildActivityPayload,

    // Client Debts
    ClientDebtSchema,
    buildClientDebtPayload,

    // Attendance
    isPresentStatus,
    calculatePresenceStats,
    calculateClientPresenceCardStats,
    calculateMonthStats,
    countWeekdayOccurrencesInRange,
    calculateExpectedAttendancesFromEnrollments,
    formatComparison,

    // Mappers
    mapToGridFormat,

    // Monitoring
    PerformanceLogSchema,
    getPerformanceCategory,
    trackPerformance
};
