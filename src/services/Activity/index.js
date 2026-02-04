/**
 * @deprecated Este arquivo é um wrapper legado para compatibilidade.
 * MIGRAÇÃO GRADUAL: Use ActivityService diretamente de services/Admin/ActivityService
 * 
 * Módulos que ainda usam este wrapper:
 * - Grade (useGradeData)
 * - Classes (useClassesPage) 
 */
import { ActivityService } from '../Admin/ActivityService'
import { StorageService } from '../Storage/StorageService'
import { useState } from 'react'

export const listActivitiesWithObjectives = async (idTenant, idBranch) => {
    return await ActivityService.listAll(idTenant, idBranch)
}

export const createActivityWithSchedule = async (idTenant, idBranch, userId, activityData) => {
    return await ActivityService.createActivity(idTenant, idBranch, userId, activityData)
}

export const updateActivity = async (idTenant, idBranch, userId, activityId, activityData) => {
    return await ActivityService.updateActivity(idTenant, idBranch, userId, activityId, activityData)
}

export const deleteActivity = async (idTenant, idBranch, userId, activityId, userName) => {
    return await ActivityService.deleteActivity(idTenant, idBranch, userId, activityId, userName)
}

export const reorderActivities = async (idTenant, idBranch, userId, orderedIds) => {
    return await ActivityService.reorderActivities(idTenant, idBranch, userId, orderedIds)
}

export const listActivities = async (idTenant, idBranch) => {
    return await ActivityService.listAll(idTenant, idBranch)
}

export const useActivityPhotoUpload = () => {
    const [uploading, setUploading] = useState(false)

    const uploadPhoto = async (file, options = {}) => {
        try {
            setUploading(true)
            const path = `activities/${Date.now()}_${file.name}`
            const url = await StorageService.uploadFile(file, path)
            
            if (options.deleteOldPhoto && options.deleteOldPhoto !== url) {
                await StorageService.deleteFile(options.deleteOldPhoto)
            }
            
            return url
        } catch (error) {
            console.error('Error uploading photo:', error)
            throw error
        } finally {
            setUploading(false)
        }
    }

    return { uploadPhoto, uploading }
}
