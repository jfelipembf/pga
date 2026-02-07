import React, { useState, useEffect } from 'react'
import { Input } from 'reactstrap'
import { maskCurrency, unmask } from '../../utils/maskUtils'

/**
 * CurrencyInput
 * Um input customizado que exibe valores em R$ mas retorna números para o Formik.
 */
const CurrencyInput = ({ value, onChange, onBlur, name, ...props }) => {
    const [displayValue, setDisplayValue] = useState("")

    useEffect(() => {
        // Quando o valor (número) mudar externamente, atualizamos a máscara
        if (value !== undefined && value !== null) {
            // Se o valor já for um número formatado (ex: 1250.50), transformamos em string de centavos para a máscara
            // Multiplicamos por 100 para converter o float em "centavos inteiros" que a maskCurrency espera
            const cents = Math.round(Number(value) * 100)
            setDisplayValue(maskCurrency(String(cents)))
        }
    }, [value])

    const handleChange = (e) => {
        const rawValue = e.target.value
        const masked = maskCurrency(rawValue)
        setDisplayValue(masked)

        if (onChange) {
            // Convertemos de volta para número real (decimal) para o Formik
            const numericValue = Number(unmask(masked)) / 100

            // Simulamos um evento para que o Formik/onChange padrão funcione
            onChange({
                target: {
                    name: name,
                    value: numericValue
                }
            })
        }
    }

    return (
        <Input
            {...props}
            name={name}
            value={displayValue}
            onChange={handleChange}
            onBlur={onBlur}
            type="text" // Usamos text para permitir a máscara visual
        />
    )
}

export default CurrencyInput
