import { StaffService } from '../Admin/StaffService'
import { StorageService } from '../Storage/StorageService'
import { useState } from 'react'

export const createStaff = async (idTenant, idBranch, userId, staffData) => {
    return await StaffService.createStaff(idTenant, idBranch, userId, staffData)
}

export const updateStaff = async (idTenant, idBranch, userId, staffId, staffData) => {
    return await StaffService.updateStaff(idTenant, idBranch, userId, staffId, staffData)
}

export const deleteStaff = async (idTenant, idBranch, userId, staffId) => {
    return await StaffService.deleteStaff(idTenant, idBranch, userId, staffId)
}

export const listStaff = async (idTenant, idBranch, filters = {}) => {
    return await StaffService.listWithFilters(idTenant, idBranch, filters)
}

export const useStaffPhotoUpload = () => {
    const [uploading, setUploading] = useState(false)

    const uploadPhoto = async (file, options = {}) => {
        try {
            setUploading(true)
            const path = `staff/${Date.now()}_${file.name}`
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
