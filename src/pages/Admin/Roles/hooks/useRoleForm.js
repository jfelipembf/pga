import { useState, useEffect } from 'react'
import { useRoles } from './useRoles'

export const useRoleForm = () => {
    const { filteredRoles: roles } = useRoles()
    const [selectedId, setSelectedId] = useState(null)
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [formData, setFormData] = useState(null)

    useEffect(() => {
        if (selectedId) {
            const role = roles.find(r => r.id === selectedId)
            if (role) {
                setFormData(role)
            }
        } else if (isAddingNew) {
            setFormData({
                name: '',
                description: '',
                permissions: {},
                isActive: true
            })
        } else {
            setFormData(null)
        }
    }, [selectedId, isAddingNew, roles])

    const handleAddClick = () => {
        setIsAddingNew(true)
        setSelectedId(null)
    }

    const handleRoleClick = (role) => {
        setSelectedId(role.id)
        setIsAddingNew(false)
    }

    const handleCancel = () => {
        setIsAddingNew(false)
        setSelectedId(null)
        setFormData(null)
    }

    const clearSelection = () => {
        setSelectedId(null)
        setIsAddingNew(false)
        setFormData(null)
    }

    return {
        selectedId,
        setSelectedId,
        isAddingNew,
        formData,
        setFormData,
        handleAddClick,
        handleRoleClick,
        handleCancel,
        clearSelection
    }
}
