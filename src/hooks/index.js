/**
 * HOOKS INDEX
 * 
 * Ponto central de exportação dos hooks customizados.
 */

// Auth & Permissions (Principal)
export { useAuth } from './useAuth'

// Permissions (wrapper de useAuth para retrocompatibilidade)
export { usePermissions } from './usePermissions'

// Tenant/Multi-tenant
export { useTenant } from './useTenant'

// Utilities
export { useLoading } from './useLoading'
export { useAddressLookup } from './useAddressLookup'
export { usePhotoUpload } from './usePhotoUpload'
export { useWeekCache } from './useWeekCache'
