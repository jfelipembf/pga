import React from "react"
import { Form, FormGroup, Label, Input, Alert } from "reactstrap"

// Custom Components
import ButtonLoader from "../../../../components/Common/ButtonLoader"
import PageLoader from "../../../../components/Common/PageLoader"

const IntegrationForm = ({
    selected,
    data = {},
    onChange,
    onSave,
    loading,
    isFetching,
    showBranchWarning
}) => {

    const renderFields = () => {
        switch (selected) {
            case "gemini":
                return (
                    <>
                        <h4 className="card-title mb-4">Configuração Google Gemini</h4>
                        <FormGroup>
                            <Label>API Key</Label>
                            <Input
                                type="password"
                                placeholder="Insira sua API Key do Google AI Studio"
                                value={data.apiKey || ""}
                                onChange={e => onChange({ ...data, apiKey: e.target.value })}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>Modelo Padrão</Label>
                            <Input
                                type="select"
                                value={data.model || "gemini-pro"}
                                onChange={e => onChange({ ...data, model: e.target.value })}
                            >
                                <option value="gemini-pro">Gemini Pro</option>
                                <option value="gemini-pro-vision">Gemini Pro Vision</option>
                            </Input>
                        </FormGroup>
                    </>
                )
            case "openai":
                return (
                    <>
                        <h4 className="card-title mb-4">Configuração OpenAI</h4>
                        <FormGroup>
                            <Label>API Key</Label>
                            <Input
                                type="password"
                                placeholder="sk-..."
                                value={data.apiKey || ""}
                                onChange={e => onChange({ ...data, apiKey: e.target.value })}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>Modelo Padrão</Label>
                            <Input
                                type="select"
                                value={data.model || "gpt-4"}
                                onChange={e => onChange({ ...data, model: e.target.value })}
                            >
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </Input>
                        </FormGroup>
                    </>
                )
            case "evolution":
            case "evolution_financial":
                return (
                    <>
                        <h4 className="card-title mb-4">
                            {selected === "evolution" ? "Configuração Evolution AI (Whatsapp Clientes)" : "Configuração Robô de Despesas (Pessoal)"}
                        </h4>

                        <Alert color="info" className="mb-4">
                            <i className="mdi mdi-information-outline me-2"></i>
                            {selected === "evolution"
                                ? "Esta instância será usada para enviar mensagens automáticas de sistema (aniversários, agendamentos)."
                                : "Esta instância será usada para receber mensagens de despesas. Configure o 'Número Permitido' para garantir que apenas você possa cadastrar."
                            }
                        </Alert>

                        <FormGroup>
                            <Label>URL da Instância</Label>
                            <Input
                                type="url"
                                placeholder="https://api.seudominio.com"
                                value={data.baseUrl || ""}
                                onChange={e => onChange({ ...data, baseUrl: e.target.value })}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>API Key / Token</Label>
                            <Input
                                type="password"
                                placeholder="Token de autenticação global"
                                value={data.apiKey || ""}
                                onChange={e => onChange({ ...data, apiKey: e.target.value })}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>Nome da Instância (Ex: {selected === "evolution" ? "SwimMain" : "SwimFinance"})</Label>
                            <Input
                                type="text"
                                placeholder="Minha Instância"
                                value={data.instanceName || ""}
                                onChange={e => onChange({ ...data, instanceName: e.target.value })}
                            />
                        </FormGroup>

                        {/* [NEW] Whitelist field only for Financial Bot */}
                        {selected === "evolution_financial" && (
                            <>
                                <FormGroup>
                                    <Label className="text-primary fw-bold">Gemini API Key (Inteligência)</Label>
                                    <Input
                                        type="password"
                                        placeholder="Chave do Google AI Studio"
                                        value={data.geminiApiKey || ""}
                                        onChange={e => onChange({ ...data, geminiApiKey: e.target.value })}
                                    />
                                    <small className="text-muted">Necessária para ler e entender as despesas.</small>
                                </FormGroup>

                                <FormGroup>
                                    <Label className="text-danger fw-bold">Número Permitido (Seu WhatsApp)</Label>
                                    <Input
                                        type="text"
                                        placeholder="5511999999999"
                                        value={data.allowedNumber || ""}
                                        onChange={e => onChange({ ...data, allowedNumber: e.target.value })}
                                    />
                                    <small className="text-muted">Apenas mensagens vindas deste número serão processadas.</small>
                                </FormGroup>
                            </>
                        )}
                    </>
                )
            default:
                return null
        }
    }

    if (isFetching) {
        return <PageLoader />
    }

    return (
        <Form onSubmit={(e) => { e.preventDefault(); onSave() }}>
            {showBranchWarning && (
                <Alert color="warning" className="mb-4">
                    <i className="mdi mdi-alert-outline me-2"></i>
                    Selecione uma filial no menu superior para gerenciar as integrações.
                </Alert>
            )}
            {renderFields()}

            <div className="d-flex justify-content-end mt-4">
                <ButtonLoader color="primary" type="submit" loading={loading}>
                    Salvar Configurações
                </ButtonLoader>
            </div>
        </Form>
    )
}

export default IntegrationForm
