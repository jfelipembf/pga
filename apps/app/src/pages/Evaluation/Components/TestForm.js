import React, { useState } from "react"
import PropTypes from "prop-types"
import { Input, Badge } from "reactstrap"
import { useToast } from "../../../components/Common/ToastProvider"
import { saveTestResult } from "../../../services/Tests/tests.service"
import { useEvaluationFormLogic } from "../Hooks/useEvaluationFormLogic"
import { PLACEHOLDER_AVATAR as placeholderAvatar } from "../Constants/evaluationDefaults"
import InputMask from "react-input-mask"
import ButtonLoader from "../../../components/Common/ButtonLoader"

const TestForm = ({ testEvent, classId }) => {
    const [results, setResults] = useState({})
    const toast = useToast()

    const {
        isLoading,
        withLoading,
        evaluationClients,
    } = useEvaluationFormLogic({ classId })

    const handleResultChange = (clientId, value) => {
        setResults(prev => ({
            ...prev,
            [clientId]: { ...prev[clientId], value }
        }))
    }

    const parseTime = (timeStr) => {
        const parts = timeStr.split(':').map(Number)
        if (parts.length !== 3) return 0
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2]
    }

    const isDistanceFixed = testEvent.testType === 'tempo'

    const handleSave = async (client) => {
        const clientId = String(client.id)
        const entry = results[clientId]
        if (!entry || !entry.value) return

        let numericResult = 0
        if (isDistanceFixed) {
            numericResult = parseTime(entry.value)
        } else {
            numericResult = Number(entry.value)
        }

        try {
            await withLoading(`save-${clientId}`, async () => {
                await saveTestResult({
                    idTestEvent: testEvent.id,
                    idClient: client.id,
                    testType: testEvent.testType,
                    result: entry.value,
                    numericResult,
                    // Metadata for history
                    title: testEvent.title || "",
                    distanceMeters: testEvent.distanceMeters,
                    targetTime: testEvent.targetTime
                })
                toast.show({ title: "Sucesso", description: "Resultado salvo com sucesso!", color: "success" })
            })
        } catch (e) {
            console.error(e)
            toast.show({ title: "Erro", description: "Erro ao salvar resultado.", color: "danger" })
        }
    }

    if (!classId) {
        return (
            <div className="text-center py-5">
                <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                    <i className="mdi mdi-account-group text-muted fs-4" />
                </div>
                <p className="text-muted mb-0">Selecione uma turma para ver os alunos matriculados.</p>
            </div>
        )
    }

    if (isLoading('clients')) {
        return <div className="p-3 text-center"><i className="mdi mdi-loading mdi-spin me-2" />Carregando alunos...</div>
    }

    return (
        <div className="test-form">
            <div className="mb-4 d-flex align-items-center justify-content-between">
                <div>
                    <Badge color="info" className="mb-1">{isDistanceFixed ? "Meta: Distância Fixa" : "Meta: Tempo Fixo"}</Badge>
                    <div className="text-muted small">
                        {isDistanceFixed ? "Registre o tempo (HH:MM:SS)" : "Registre a distância (metros)"}
                    </div>
                </div>
                <Badge color="dark">{evaluationClients.length} Alunos</Badge>
            </div>

            <div className="d-flex flex-column gap-2">
                {evaluationClients.length === 0 ? (
                    <div className="text-center py-5">
                        <p className="text-muted">Nenhum aluno matriculado nesta turma.</p>
                    </div>
                ) : (
                    evaluationClients.map(client => {
                        const sId = String(client.id) // This is Client ID
                        return (
                            <div key={sId} className="d-flex align-items-center gap-3 px-3 py-3 border rounded bg-white shadow-sm">
                                <div
                                    className="rounded-circle bg-light flex-shrink-0"
                                    style={{
                                        width: 50,
                                        height: 50,
                                        backgroundImage: `url(${client.photo || placeholderAvatar})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                />
                                <div className="flex-grow-1">
                                    <div className="fw-semibold">{client.name}</div>
                                    <div className="text-muted small">ID: {client.idGym || "--"}</div>
                                </div>

                                <div className="d-flex gap-2 align-items-center">
                                    {isDistanceFixed ? (
                                        <InputMask
                                            mask="99:99:99"
                                            value={results[client.id]?.value || ""}
                                            onChange={(e) => handleResultChange(client.id, e.target.value)}
                                        >
                                            {(inputProps) => <Input {...inputProps} bsSize="sm" placeholder="HH:MM:SS" style={{ width: 100 }} />}
                                        </InputMask>
                                    ) : (
                                        <Input
                                            type="number"
                                            bsSize="sm"
                                            placeholder="Metros"
                                            style={{ width: 100 }}
                                            value={results[client.id]?.value || ""}
                                            onChange={(e) => handleResultChange(client.id, e.target.value)}
                                        />
                                    )}
                                    <ButtonLoader
                                        size="sm"
                                        color="primary"
                                        onClick={() => handleSave(client)}
                                        loading={isLoading(`save-${client.id}`)}
                                    >
                                        <i className="mdi mdi-check"></i>
                                    </ButtonLoader>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

TestForm.propTypes = {
    testEvent: PropTypes.object,
    classId: PropTypes.string
}

export default TestForm
