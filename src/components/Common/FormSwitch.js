import React from "react"
import Switch from "react-switch"

const OnSymbol = () => <div style={{ height: "100%" }} />
const OffSymbol = () => <div style={{ height: "100%" }} />

/**
 * Componente de Switch padronizado para o projeto.
 * Encapsula a biblioteca react-switch com os estilos do PGA Admin.
 */
export const FormSwitch = ({
    checked,
    onChange,
    onColor = "#466a8f",
    offColor = "#74788d",
    label,
    description,
    id,
    height = 20,
    width = 40,
    handleDiameter = 14
}) => {
    return (
        <div className="d-flex align-items-center">
            <Switch
                id={id}
                uncheckedIcon={<OffSymbol />}
                checkedIcon={<OnSymbol />}
                onColor={onColor}
                offColor={offColor}
                onChange={onChange}
                checked={checked}
                height={height}
                width={width}
                handleDiameter={handleDiameter}
            />
            {(label || description) && (
                <div className="ms-3">
                    {label && (
                        <label
                            htmlFor={id}
                            className={`mb-0 fw-bold cursor-pointer ${checked ? 'text-success' : 'text-danger'}`}
                            style={{ userSelect: 'none', cursor: 'pointer' }}
                        >
                            {label}
                        </label>
                    )}
                    {description && <div className="text-muted small">{description}</div>}
                </div>
            )}
        </div>
    )
}
