/**
 * Re-exports from @pga/shared for backward compatibility
 * Use centralized constants from @pga/shared package
 */
import { EnrollmentType, EnrollmentStatus } from "@pga/shared"

// Re-export with legacy names for backward compatibility
export const ENROLLMENT_TYPES = EnrollmentType
export const ENROLLMENT_STATUS = EnrollmentStatus

// Field constants (UI-specific, kept local)
export const ENROLLMENT_FIELDS = {
    ID: 'id',
    ID_ENROLLMENT: 'idEnrollment',
    ID_CLIENT: 'idClient',
    ID_CLASS: 'idClass',
    ID_ACTIVITY: 'idActivity',
    ID_SESSION: 'idSession',
    ID_STAFF: 'idStaff',
    ID_TENANT: 'idTenant',
    ID_BRANCH: 'idBranch',
    TYPE: 'type',
    STATUS: 'status',
    ACTIVITY_NAME: 'activityName',
    EMPLOYEE_NAME: 'employeeName',
    WEEKDAY: 'weekday',
    START_TIME: 'startTime',
    END_TIME: 'endTime',
    START_DATE: 'startDate',
    END_DATE: 'endDate',
    SESSION_DATE: 'sessionDate',
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt'
}
