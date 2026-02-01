import React from "react"
import { Button, Label } from "reactstrap"

export const WEEKDAY_OPTIONS = [
    { value: '0', label: 'Dom' },
    { value: '1', label: 'Seg' },
    { value: '2', label: 'Ter' },
    { value: '3', label: 'Qua' },
    { value: '4', label: 'Qui' },
    { value: '5', label: 'Sex' },
    { value: '6', label: 'Sáb' },
]

export const WeekDaySelector = ({ selectedDays, onChange }) => {
    // Array seguro
    const currentSelection = Array.isArray(selectedDays) ? selectedDays : []

    const toggleDay = (dayValue) => {
        if (currentSelection.includes(dayValue)) {
            // Remove
            onChange(currentSelection.filter(d => d !== dayValue))
        } else {
            // Adiciona
            onChange([...currentSelection, dayValue])
        }
    }

    return (
        <React.Fragment>
            <Label className="fw-semibold d-block">Dias permitidos para uso</Label>
            <div className="d-flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map(option => {
                    const isSelected = currentSelection.includes(option.value)
                    return (
                        <Button
                            key={option.value}
                            type="button"
                            size="sm"
                            color={isSelected ? "primary" : "light"} // Primary = Highlighted/Selected
                            className={`px-3 ${isSelected ? '' : 'text-muted'}`}
                            onClick={() => toggleDay(option.value)}
                        >
                            {option.label}
                        </Button>
                    )
                })}
            </div>
            <small className="text-muted d-block mt-1">
                {currentSelection.length === 0
                    ? "Se nenhum dia for selecionado, o acesso é livre todos os dias."
                    : "O aluno só poderá acessar a academia nestes dias."}
            </small>
        </React.Fragment>
    )
}
