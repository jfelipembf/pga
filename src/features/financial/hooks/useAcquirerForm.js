import { useState, useMemo } from 'react'
import { useFormik } from "formik"
import { AcquirerSchema } from "../../../data/schemas/Financial/AcquirerSchema"
import { generateFees, calculateInitialValues } from "../utils/acquirerUtils"
import { BASIC_BRANDS } from "../constants/AcquirerDefaults"

export const useAcquirerForm = (initialData, onSave) => {
    const [customBrand, setCustomBrand] = useState('')
    const [extraBrands, setExtraBrands] = useState([])

    // Memoize initial values logic
    const initialValues = useMemo(() => calculateInitialValues(initialData), [initialData])

    const formik = useFormik({
        initialValues,
        validationSchema: AcquirerSchema,
        enableReinitialize: true,
        onSubmit: (values) => {
            // Cleanup UI props before saving (remove maxInstallment if needed, or keep it for future edits)
            // For now we keep it as it's useful metadata
            onSave(values)
        }
    })

    const getAllBrands = () => {
        const brands = [...BASIC_BRANDS, ...extraBrands]

        // Find custom brands that are already in the config but not in our basic list
        const allSelectedIds = formik.values.rateConfigs.flatMap(c => c.brands || [])
        const customFromValues = allSelectedIds.filter(
            id => !brands.some(b => b.id === id)
        ).map(id => ({ id, label: id, icon: 'fas fa-tag fa-2x text-secondary' }))

        // De-duplicate custom brands
        const uniqueCustom = []
        const seen = new Set()
        customFromValues.forEach(item => {
            if (!seen.has(item.id)) {
                seen.add(item.id)
                uniqueCustom.push(item)
            }
        })

        return [...brands, ...uniqueCustom]
    }

    const handleAddCustomBrand = () => {
        if (customBrand.trim()) {
            const newId = customBrand.toLowerCase().replace(/\s+/g, '-')
            const newBrand = { id: newId, label: customBrand, icon: 'fas fa-tag fa-2x text-secondary' }
            setExtraBrands(prev => [...prev, newBrand])
            setCustomBrand('')
        }
    }

    const toggleBrandInConfig = (configIndex, brandId) => {
        const currentConfig = formik.values.rateConfigs[configIndex]
        const currentBrands = currentConfig.brands || []

        if (currentBrands.includes(brandId)) {
            formik.setFieldValue(`rateConfigs.${configIndex}.brands`, currentBrands.filter(id => id !== brandId))
        } else {
            // Check if brand is in other groups (optional rule: exclusive assignment)
            // We allow overlap but logically it's usually exclusive. 
            // We won't auto-remove from others to avoid confusion, just Add.
            formik.setFieldValue(`rateConfigs.${configIndex}.brands`, [...currentBrands, brandId])
        }
    }

    const addRateGroup = () => {
        const newGroup = {
            id: Date.now(),
            name: `Grupo ${formik.values.rateConfigs.length + 1}`,
            brands: [],
            fees: generateFees(null),
            maxInstallment: 12
        }
        formik.setFieldValue('rateConfigs', [...formik.values.rateConfigs, newGroup])
    }

    const removeRateGroup = (index) => {
        const newConfigs = formik.values.rateConfigs.filter((_, i) => i !== index)
        formik.setFieldValue('rateConfigs', newConfigs)
    }

    const addNextInstallment = (configIndex) => {
        const currentMax = formik.values.rateConfigs[configIndex].maxInstallment
        const next = currentMax + 1
        formik.setFieldValue(`rateConfigs.${configIndex}.maxInstallment`, next)
        formik.setFieldValue(`rateConfigs.${configIndex}.fees.creditCard${next}x`, 0)
    }

    const isBrandSelectedInOther = (currentConfigIndex, brandId) => {
        return formik.values.rateConfigs.some((c, idx) => idx !== currentConfigIndex && c.brands.includes(brandId))
    }

    return {
        formik,
        customBrand,
        setCustomBrand,
        actions: {
            handleAddCustomBrand,
            toggleBrandInConfig,
            addRateGroup,
            removeRateGroup,
            addNextInstallment,
            getAllBrands,
            isBrandSelectedInOther
        }
    }
}
