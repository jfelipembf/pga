import { useState } from "react"
import moment from "moment"

const initialData = {
    name: "",
    type: "evaluation",
    startDate: moment().format("YYYY-MM-DD"),
    endDate: moment().add(30, 'days').format("YYYY-MM-DD"),
    status: "active",
    description: "",
    testConfig: {
        measureType: "fixed-time",
        referenceValue: "",
        unit: "min"
    }
}

export const useEventForm = () => {
    const [selectedId, setSelectedId] = useState(null)
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [formData, setFormData] = useState(initialData)

    const handleAddClick = () => {
        setFormData(initialData)
        setIsAddingNew(true)
        setSelectedId(null)
    }

    const handleEventClick = (event) => {
        setFormData({
            ...initialData,
            ...event,
            testConfig: {
                ...initialData.testConfig,
                ...(event.testConfig || {})
            }
        })
        setSelectedId(event.id)
        setIsAddingNew(false)
    }

    const handleCancel = () => {
        setSelectedId(null)
        setIsAddingNew(false)
        setFormData(initialData)
    }

    return {
        selectedId,
        isAddingNew,
        formData,
        setFormData,
        handleAddClick,
        handleEventClick,
        handleCancel
    }
}
