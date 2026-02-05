import { useState, useEffect, useCallback } from "react"
import { TestResultService } from "../../../services/Events/TestResultService"
import { useTenant } from "../../../hooks/useTenant"
import { toast } from "react-toastify"

export const useTestFormLogic = ({
    idActivity,
    activeEvent,
    clients,
    excludedIds,
    withLoading
}) => {
    const { idTenant, idBranch, user } = useTenant()
    const [testDrafts, setTestDrafts] = useState({}) // { clientId: { result: '', notes: '' } }

    // Preencher rascunhos com resultados existentes
    useEffect(() => {
        if (!idTenant || !idBranch || !idActivity || !activeEvent?.id) return

        const loadExistingResults = async () => {
            try {
                await withLoading('loadTests', async () => {
                    const results = await TestResultService.getResultsByActivity(idTenant, idBranch, idActivity, activeEvent.id)
                    const drafts = {}

                    results.forEach(r => {
                        const measureType = activeEvent.testConfig?.measureType
                        const isDistanceMetric = ['fixed-time', 'distance'].includes(measureType)
                        const resultVal = isDistanceMetric ? String(r.resultDistance || '') : String(r.resultTime || '')

                        drafts[String(r.idStudent)] = {
                            result: resultVal,
                            notes: r.notes || ''
                        }
                    })

                    setTestDrafts(drafts)
                })
            } catch (error) {
                console.error("Erro ao carregar resultados existentes:", error)
            }
        }

        loadExistingResults()
    }, [idTenant, idBranch, idActivity, activeEvent?.id, withLoading])

    const formatTime = (value) => {
        // Remove tudo que não é número
        const numbers = value.replace(/\D/g, '').slice(0, 6)
        let formatted = numbers
        if (numbers.length > 2) formatted = numbers.slice(0, 2) + ':' + numbers.slice(2)
        if (numbers.length > 4) formatted = numbers.slice(0, 2) + ':' + numbers.slice(2, 4) + ':' + numbers.slice(4)
        return formatted
    }

    const handleResultChange = (clientId, value) => {
        const isDistanceMetric = ['fixed-time', 'distance'].includes(activeEvent?.testConfig?.measureType)
        const finalValue = isDistanceMetric ? value : formatTime(value)

        setTestDrafts(prev => ({
            ...prev,
            [clientId]: {
                ...(prev[clientId] || {}),
                result: finalValue
            }
        }))
    }

    const handleNotesChange = (clientId, value) => {
        setTestDrafts(prev => ({
            ...prev,
            [clientId]: {
                ...(prev[clientId] || {}),
                notes: value
            }
        }))
    }

    const saveTests = useCallback(async () => {
        if (!activeEvent || !idActivity) return

        const excludedSet = new Set(excludedIds || [])
        const testClients = clients.filter(c => !excludedSet.has(String(c.id)))

        if (testClients.length === 0) {
            toast.warning("Nenhum aluno selecionado para o teste")
            return
        }

        await withLoading('saveTests', async () => {
            try {
                const promises = testClients.map(async (client) => {
                    const clientId = String(client.id)
                    const draft = testDrafts[clientId]

                    if (!draft || !draft.result) return

                    const payload = {
                        idStudent: clientId,
                        idActivity: idActivity,
                        idEvent: activeEvent.id,
                        idInstructor: user.uid,
                        date: new Date().toISOString().split('T')[0],
                        type: activeEvent.testConfig?.measureType,
                        notes: draft.notes || ""
                    }

                    if (['fixed-time', 'distance'].includes(activeEvent.testConfig?.measureType)) {
                        payload.resultDistance = parseFloat(draft.result)
                    } else {
                        payload.resultTime = draft.result // Ex: "10:30"
                    }

                    console.log("Saving Test Result Payload:", payload)

                    return TestResultService.registerResult(idTenant, idBranch, user, payload)
                })

                await Promise.all(promises)
                toast.success("Resultados de testes salvos com sucesso!")
            } catch (error) {
                console.error("Erro ao salvar testes:", error)
                toast.error(error.message || "Erro ao salvar resultados")
            }
        })
    }, [idTenant, idBranch, user, idActivity, activeEvent, clients, excludedIds, testDrafts, withLoading])

    return {
        testDrafts,
        handleResultChange,
        handleNotesChange,
        saveTests,
        dirtyCount: Object.entries(testDrafts).filter(([clientId, d]) => {
            const isExcluded = new Set(excludedIds || []).has(String(clientId))
            return !isExcluded && !!d.result
        }).length
    }
}
