import { useCallback, useEffect, useState } from "react"

/**
 * Mantém um estado local sincronizado com o valor vindo do formulário pai
 * e propaga alterações via `onChange`.
 */
const useSyncedFormState = ({ value = null, onChange } = {}) => {
  const [formState, setFormState] = useState(value)

  // Sempre que o valor vindo do pai mudar, refletir localmente
  useEffect(() => {
    setFormState(value ?? null)
  }, [value])

  const updateField = useCallback(
    (field, nextValue) => {
      setFormState(prev => {
        const base = prev ?? {}
        const resolvedValue = typeof nextValue === "function" ? nextValue(base[field], base) : nextValue
        const nextState = { ...base, [field]: resolvedValue }
        onChange?.(nextState)
        return nextState
      })
    },
    [onChange]
  )

  return { formState, setFormState, updateField }
}

export default useSyncedFormState
