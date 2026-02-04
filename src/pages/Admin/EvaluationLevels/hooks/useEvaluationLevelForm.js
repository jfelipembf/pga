import { useState, useEffect } from 'react'
import { useEvaluationLevels } from './useEvaluationLevels'

export const useEvaluationLevelForm = () => {
    const { levels } = useEvaluationLevels()
    const [selectedId, setSelectedId] = useState(null)
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [formData, setFormData] = useState(null)

    useEffect(() => {
        if (selectedId) {
            const level = levels.find(l => l.id === selectedId)
            if (level) {
                setFormData(level)
            }
        } else if (isAddingNew) {
            // Calcula próximo valor e ordem
            const maxValue = levels.length > 0 
                ? Math.max(...levels.map(l => l.value || 0))
                : 0
            const maxOrder = levels.length > 0
                ? Math.max(...levels.map(l => l.order || 0))
                : -1

            setFormData({
                title: '',
                value: maxValue + 1,
                order: maxOrder + 1,
                isActive: true
            })
        } else {
            setFormData(null)
        }
    }, [selectedId, isAddingNew, levels])

    const handleAddClick = () => {
        setIsAddingNew(true)
        setSelectedId(null)
    }

    const handleLevelClick = (level) => {
        setSelectedId(level.id)
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
        handleLevelClick,
        handleCancel,
        clearSelection
    }
}
