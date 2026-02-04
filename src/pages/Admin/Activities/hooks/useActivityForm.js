import { useState, useCallback } from 'react'

/**
 * Hook para gerenciar estado do formulário de atividade
 * Separa lógica de UI da lógica de negócio
 */
export const useActivityForm = () => {
    const [selectedId, setSelectedId] = useState(null)
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [formData, setFormData] = useState(null)
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState("")

    const handleAddClick = useCallback(() => {
        setIsAddingNew(true)
        setSelectedId(null)
        setFormData({ 
            name: '', 
            description: '', 
            color: '#3c5068', 
            isActive: true, 
            objectives: [] 
        })
        setPhotoFile(null)
        setPhotoPreview("")
    }, [])

    const handleActivityClick = useCallback((activity) => {
        setSelectedId(activity.id)
        setIsAddingNew(false)
        setFormData(activity)
        setPhotoFile(null)
        setPhotoPreview(activity.photoUrl || activity.photo || "")
    }, [])

    const handleCancel = useCallback(() => {
        setIsAddingNew(false)
        setSelectedId(null)
        setFormData(null)
        setPhotoFile(null)
        setPhotoPreview("")
    }, [])

    const handlePhotoChange = useCallback((file) => {
        setPhotoFile(file)
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setPhotoPreview(reader.result)
            reader.readAsDataURL(file)
        }
    }, [])

    const clearSelection = useCallback(() => {
        setSelectedId(null)
        setIsAddingNew(false)
        setFormData(null)
    }, [])

    return {
        selectedId,
        isAddingNew,
        formData,
        photoFile,
        photoPreview,
        setFormData,
        handleAddClick,
        handleActivityClick,
        handleCancel,
        handlePhotoChange,
        clearSelection
    }
}
