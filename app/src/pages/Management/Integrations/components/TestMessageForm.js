import React, { useState } from "react"
import { Row, Col, Card, CardBody, CardHeader, Alert, Input, Label } from "reactstrap"
import { useSelector } from "react-redux"
import { httpsCallable } from "firebase/functions"
import { getFirebaseFunctions, getFirebaseDb } from "../../../../helpers/firebase_helper"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import AsyncSelect from "react-select/async"

import ButtonLoader from "../../../../components/Common/ButtonLoader"
import { useToast } from "../../../../components/Common/ToastProvider"

const TestMessageForm = () => {
    const { idBranch } = useSelector(state => state.Branch)
    const { tenant } = useSelector(state => state.Tenant)
    const idTenant = tenant?.idTenant || tenant?.id || localStorage.getItem("idTenant")
    const [selectedClient, setSelectedClient] = useState(null)
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [testResult, setTestResult] = useState(null)

    const toast = useToast()

    const loadOptions = async (inputValue) => {
        if (!idBranch || !idTenant) {
            return []
        }

        try {
            const db = getFirebaseDb()
            const clientsRef = collection(db, "tenants", idTenant, "branches", idBranch, "clients")

            let q;
            if (!inputValue || inputValue.length < 3) {
                // Default: load recent 10 clients
                q = query(clientsRef, limit(10))
            } else {
                // Search by name
                q = query(
                    clientsRef,
                    where("name", ">=", inputValue),
                    where("name", "<=", inputValue + "\uf8ff"),
                    limit(10)
                )
            }

            const snapshot = await getDocs(q)
            const options = []

            snapshot.forEach(doc => {
                const data = doc.data()
                options.push({
                    label: `${data.name} ${data.phone ? `(${data.phone})` : ''}`,
                    value: doc.id,
                    data: data
                })
            })
            return options
        } catch (error) {
            console.error("Error loading clients:", error)
            return []
        }
    }

    const handleSend = async () => {
        if (!selectedClient || !message) return

        setLoading(true)
        setTestResult(null)

        try {
            const functions = getFirebaseFunctions()
            const sendWhatsAppMessage = httpsCallable(functions, "sendWhatsAppMessage")
            const response = await sendWhatsAppMessage({
                idTenant,
                idBranch,
                idClient: selectedClient.value,
                message,
            })

            setTestResult({ success: true, data: response.data })
            toast.show({ title: "Sucesso", description: "Mensagem enviada!", color: "success" })
        } catch (error) {
            console.error(error)
            setTestResult({ success: false, error: error.message })
            toast.show({ title: "Erro", description: error.message, color: "danger" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="shadow-sm mt-4 border-warning" style={{ borderWidth: '1px', borderStyle: 'dashed' }}>
            <CardHeader className="bg-warning bg-soft">
                <h5 className="mb-0 text-warning"><i className="mdi mdi-test-tube me-2"></i>Área de Teste de Integração</h5>
            </CardHeader>
            <CardBody>
                <Row className="gy-3">
                    <Col md={6}>
                        <Label>Buscar Cliente para Teste</Label>
                        <AsyncSelect
                            cacheOptions
                            loadOptions={loadOptions}
                            defaultOptions
                            onChange={setSelectedClient}
                            placeholder="Digite para buscar..."
                            noOptionsMessage={({ inputValue }) =>
                                inputValue.length < 3 ? "Digite pelo menos 3 caracteres" : "Nenhum cliente encontrado"
                            }
                            isClearable
                            styles={{
                                menu: provided => ({ ...provided, zIndex: 9999 })
                            }}
                        />
                        {selectedClient && (
                            <div className="mt-2 text-muted small">
                                <i className="mdi mdi-check-circle text-success me-1"></i>
                                Selecionado: <strong>{selectedClient.data.name}</strong>
                                {selectedClient.data.phone && ` (${selectedClient.data.phone})`}
                            </div>
                        )}
                    </Col>
                    <Col md={6}>
                        <Label>Mensagem de Teste</Label>
                        <Input
                            type="textarea"
                            rows="4"
                            placeholder="Olá! Esta é uma mensagem de teste da Integração Evolution AI."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                    </Col>
                    <Col xs={12}>
                        <div className="d-flex justify-content-end">
                            <ButtonLoader
                                color="warning"
                                outline
                                loading={loading}
                                disabled={!selectedClient || !message || loading}
                                onClick={handleSend}
                            >
                                <i className="bx bxl-whatsapp me-2"></i>
                                Enviar Mensagem de Teste
                            </ButtonLoader>
                        </div>
                    </Col>
                </Row>

                {testResult && (
                    <div className="mt-3">
                        {testResult.success ? (
                            <Alert color="success" className="mb-0" transition={{ timeout: 0 }}>
                                <strong>Sucesso:</strong> {JSON.stringify(testResult.data)}
                            </Alert>
                        ) : (
                            <Alert color="danger" className="mb-0" transition={{ timeout: 0 }}>
                                <strong>Erro:</strong> {testResult.error}
                            </Alert>
                        )}
                    </div>
                )}
            </CardBody>
        </Card>
    )
}

export default TestMessageForm
