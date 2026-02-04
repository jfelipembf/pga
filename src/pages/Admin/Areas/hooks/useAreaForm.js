import { useState, useEffect } from 'react'
import { useAreas } from './useAreas'

export const useAreaForm = () => {
    const { filteredAreas: areas } = useAreas()
    const [selectedId, setSelectedId] = useState(null)
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [formData, setFormData] = useState(null)
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)

    // Atualiza formData quando uma área é selecionada
    useEffect(() => {
        if (selectedId) {
            const area = areas.find(a => a.id === selectedId)
            if (area) {
                setFormData(area)
                setPhotoPreview(area.photo || null)
            }
        } else if (isAddingNew) {
            setFormData({
                name: '',
                description: '',
                color: '',
                width: '',
                length: '',
                capacity: '',
                isActive: true,
                photo: ''
            })
            setPhotoPreview(null)
        } else {
            setFormData(null)
            setPhotoPreview(null)
        }
        setPhotoFile(null)
    }, [selectedId, isAddingNew, areas])

    const handleAddClick = () => {
        setIsAddingNew(true)
        setSelectedId(null)
    }

    const handleAreaClick = (area) => {
        setSelectedId(area.id)
        setIsAddingNew(false)
    }

    const handleCancel = () => {
        setIsAddingNew(false)
        setSelectedId(null)
        setFormData(null)
        setPhotoFile(null)
        setPhotoPreview(null)
    }

    const clearSelection = () => {
        setSelectedId(null)
        setIsAddingNew(false)
        setFormData(null)
        setPhotoFile(null)
        setPhotoPreview(null)
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setPhotoFile(file)
        
        const reader = new FileReader()
        reader.onloadend = () => {
            setPhotoPreview(reader.result)
        }
        reader.readAsDataURL(file)
    }

    return {
        selectedId,
        isAddingNew,
        formData,
        photoFile,
        photoPreview,
        setFormData,
        handleAddClick,
        handleAreaClick,
        handleCancel,
        handlePhotoChange,
        clearSelection
    }
}
