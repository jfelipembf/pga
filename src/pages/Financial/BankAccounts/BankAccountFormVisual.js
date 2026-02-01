import React from "react"
import { Row, Col, Label, Input, Button, Form, InputGroup, InputGroupText, FormFeedback } from "reactstrap"
import { FormSwitch } from "../../../components/Common/FormSwitch"
import { useFormik } from "formik"
import { BankAccountSchema } from "../../../data/schemas/Financial/BankAccountSchema"

export const BankAccountFormVisual = ({ initialData, onSave, onCancel }) => {

    const formik = useFormik({
        initialValues: {
            name: initialData?.name || '',
            bank: initialData?.bank || '',
            bankCode: initialData?.bankCode || '',
            agency: initialData?.agency || '',
            account: initialData?.account || '',
            accountType: initialData?.accountType || 'checking',
            isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
            isPrimary: initialData?.isPrimary || false,
            currentBalance: initialData?.currentBalance || 0,
        },
        validationSchema: BankAccountSchema,
        enableReinitialize: true,
        onSubmit: (values) => {
            onSave(values)
        }
    })

    const handleBankChange = (e) => {
        const value = e.target.value
        formik.setFieldValue('bankCode', value)
        // Mapear nome do banco baseado no código (exemplo simples)
        const banks = {
            '341': 'Itaú Unibanco',
            '001': 'Banco do Brasil',
            '237': 'Bradesco',
            '033': 'Santander',
            '104': 'Caixa Econômica',
            '260': 'Nubank',
            '077': 'Inter'
        }
        formik.setFieldValue('bank', banks[value] || 'Outro')
    }

    return (
        <div className="bank-account-form-container animate__animated animate__fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="card-title mb-0">
                    {initialData ? `Editar: ${initialData.name}` : 'Nova Conta Bancária'}
                </h4>
                <div>
                    <Button color="secondary" outline className="me-2 waves-effect" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button color="success" className="waves-effect waves-light" onClick={formik.handleSubmit}>
                        <i className="mdi mdi-check me-1"></i> Salvar
                    </Button>
                </div>
            </div>

            <Form onSubmit={formik.handleSubmit}>
                <h5 className="font-size-14 mb-3 text-uppercase fw-bold text-muted border-bottom pb-2">Dados da Conta</h5>

                <Row>
                    <Col md={12} className="mb-3">
                        <Label>Nome de Identificação (Interno)</Label>
                        <Input
                            name="name"
                            type="text"
                            placeholder="Ex: Itaú Recebíveis, Caixa Recepção..."
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            invalid={!!(formik.touched.name && formik.errors.name)}
                        />
                        {formik.errors.name && <FormFeedback>{formik.errors.name}</FormFeedback>}
                    </Col>
                </Row>

                <Row>
                    <Col md={4} className="mb-3">
                        <Label>Banco</Label>
                        <Input
                            name="bankCode"
                            type="select"
                            value={formik.values.bankCode}
                            onChange={handleBankChange}
                            invalid={!!(formik.touched.bankCode && formik.errors.bankCode)}
                        >
                            <option value="">Selecione...</option>
                            <option value="341">341 - Itaú Unibanco</option>
                            <option value="001">001 - Banco do Brasil</option>
                            <option value="237">237 - Bradesco</option>
                            <option value="033">033 - Santander</option>
                            <option value="104">104 - Caixa Econômica</option>
                            <option value="260">260 - Nubank</option>
                            <option value="077">077 - Inter</option>
                        </Input>
                        {formik.errors.bankCode && <FormFeedback>{formik.errors.bankCode}</FormFeedback>}
                    </Col>
                    <Col md={4} className="mb-3">
                        <Label>Tipo de Conta</Label>
                        <Input
                            name="accountType"
                            type="select"
                            value={formik.values.accountType}
                            onChange={formik.handleChange}
                        >
                            <option value="checking">Conta Corrente</option>
                            <option value="savings">Conta Poupança</option>
                        </Input>
                    </Col>
                    <Col md={4} className="mb-3">
                        <Label>Saldo Inicial</Label>
                        <InputGroup>
                            <InputGroupText>R$</InputGroupText>
                            <Input
                                name="currentBalance"
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={formik.values.currentBalance}
                                onChange={formik.handleChange}
                                disabled={!!initialData} // Saldo não deve ser editado diretamente após criado
                            />
                        </InputGroup>
                    </Col>
                </Row>

                <Row>
                    <Col md={4} className="mb-3">
                        <Label>Agência</Label>
                        <Input
                            name="agency"
                            type="text"
                            placeholder="Sem dígito"
                            value={formik.values.agency}
                            onChange={formik.handleChange}
                            invalid={!!(formik.touched.agency && formik.errors.agency)}
                        />
                        {formik.errors.agency && <FormFeedback>{formik.errors.agency}</FormFeedback>}
                    </Col>
                    <Col md={4} className="mb-3">
                        <Label>Número da Conta</Label>
                        <Input
                            name="account"
                            type="text"
                            placeholder="Com dígito"
                            value={formik.values.account}
                            onChange={formik.handleChange}
                            invalid={!!(formik.touched.account && formik.errors.account)}
                        />
                        {formik.errors.account && <FormFeedback>{formik.errors.account}</FormFeedback>}
                    </Col>
                </Row>

                <hr className="my-4" />

                <Row>
                    <Col md={12}>
                        <div className="mb-3">
                            <FormSwitch
                                id="isActive"
                                label={formik.values.isActive ? "Conta Ativa" : "Conta Inativa"}
                                checked={!!formik.values.isActive}
                                onChange={(val) => formik.setFieldValue('isActive', val)}
                                onColor="#34c38f"
                            />
                        </div>

                        <div className="mb-3">
                            <FormSwitch
                                id="isPrimary"
                                label={formik.values.isPrimary ? "Conta Principal (Sim)" : "Conta Principal (Não)"}
                                description="Usada como padrão para recebimentos e despesas"
                                checked={!!formik.values.isPrimary}
                                onChange={(val) => formik.setFieldValue('isPrimary', val)}
                                onColor="#34c38f"
                            />
                        </div>
                    </Col>
                </Row>
            </Form>
        </div>
    )
}
