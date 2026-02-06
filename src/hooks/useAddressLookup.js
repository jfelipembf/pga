import { useState, useCallback } from "react"
import { getAddressByCep } from "../services/External/AddressService"
import { maskCEP } from "../utils/maskUtils"

/**
 * Hook centralizado para busca de endereço por CEP
 * @param {object} formik - Instância do Formik (opcional)
 */
export const useAddressLookup = (formik = null) => {
    const [isLoadingCep, setIsLoadingCep] = useState(false)

    const handleCepBlur = useCallback(async (e) => {
        const value = e.target.value
        const cep = value?.replace(/\D/g, "")

        if (!cep || cep.length !== 8) return

        try {
            setIsLoadingCep(true)
            const address = await getAddressByCep(cep)

            if (address && !address.erro) {
                if (formik) {
                    formik.setFieldValue("street", address.logradouro || "")
                    formik.setFieldValue("neighborhood", address.bairro || "")
                    formik.setFieldValue("city", address.localidade || "")
                    formik.setFieldValue("state", address.uf || "")

                    // Focar no campo de número se existir
                    setTimeout(() => {
                        const numberInput = document.getElementById("number")
                        if (numberInput) numberInput.focus()
                    }, 100)
                }
                return address
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error)
        } finally {
            setIsLoadingCep(false)
        }
    }, [formik])

    return {
        isLoadingCep,
        handleCepBlur,
        maskCEP // Re-exporta para facilidade
    }
}
