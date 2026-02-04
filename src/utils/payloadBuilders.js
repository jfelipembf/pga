/**
 * Funções para construir payloads padronizados
 * Substituem as funções do @pga/shared
 */

export const buildStaffPayload = (data) => {
    return {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        document: data.document || '',
        photo: data.photo || '',
        roleId: data.roleId || '',
        roleName: data.roleName || data.role || '',
        areaId: data.areaId || '',
        areaName: data.areaName || '',
        active: data.active !== false,
        status: data.status || 'active',
        hireDate: data.hireDate || null,
        birthDate: data.birthDate || null,
        gender: data.gender || '',
        address: data.address || {}
    }
}

export const buildActivityPayload = (data) => {
    return {
        name: data.name || '',
        description: data.description || '',
        color: data.color || '#3c5068',
        photo: data.photo || '',
        photoUrl: data.photoUrl || '',
        active: data.active !== false,
        status: data.status || 'active',
        objectives: data.objectives || {},
        schedule: data.schedule || [],
        order: data.order || 0
    }
}

export const buildClassPayload = (data) => {
    return {
        name: data.name || '',
        description: data.description || '',
        idActivity: data.idActivity || '',
        idStaff: data.idStaff || '',
        idArea: data.idArea || '',
        weekday: data.weekday !== undefined ? Number(data.weekday) : null,
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        durationMinutes: data.durationMinutes || 0,
        maxCapacity: data.maxCapacity || 0,
        enrolledCount: data.enrolledCount || 0,
        active: data.active !== false,
        status: data.status || 'active',
        schedule: data.schedule || [],
        startDate: data.startDate || null,
        endDate: data.endDate || null
    }
}

export const buildAreaPayload = (data) => {
    return {
        name: data.name || '',
        description: data.description || '',
        color: data.color || '',
        active: data.active !== false,
        status: data.status || 'active'
    }
}

export const buildRolePayload = (data) => {
    return {
        name: data.name || '',
        description: data.description || '',
        permissions: data.permissions || [],
        active: data.active !== false,
        status: data.status || 'active'
    }
}
