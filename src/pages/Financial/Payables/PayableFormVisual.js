import React, { useMemo } from "react"
import { Row, Col, Label, Input, Button, Form, InputGroup, InputGroupText, FormFeedback } from "reactstrap"
import { useFormik } from "formik"
import { PayableSchema } from "../../../data/schemas/Financial/PayableSchema"
import { DEFAULT_CHART_OF_ACCOUNTS, DEFAULT_COST_CENTERS } from "../../../data/consts/FinancialStructs"
import { toISODate } from "../../../utils/date"

export const PayableFormVisual = ({ initialData, onCancel, onSave, hideTitle = false }) => {

    // Lista plana para facilitar busca por ID se necessário
    const chartOfAccountsList = useMemo(() => {
        const list = []
        DEFAULT_CHART_OF_ACCOUNTS.forEach(group => {
            group.children.forEach(sub => {
                sub.children.forEach(acc => {
                    list.push(acc)
                })
            })
        })
        return list
    }, [])

    const formik = useFormik({
        initialValues: {
            title: initialData?.title || initialData?.description || '',
            amount: initialData?.amount || '',
            supplier: initialData?.supplier || '',
            dueDate: toISODate(initialData?.dueDate) || '',
            documentNumber: initialData?.documentNumber || '',
            chartOfAccountId: initialData?.chartOfAccountId || '',
            costCenterId: initialData?.costCenterId || '',
            status: initialData?.status || 'open',
            notes: initialData?.notes || '',
        },
        validationSchema: PayableSchema,
        enableReinitialize: true,
        onSubmit: (values) => {
            console.log("PayableFormVisual: onSubmit disparado", values);
            // Encontrar nomes para desnormalização (boa prática para relatórios)
            const selectedAcc = chartOfAccountsList.find(a => a.id === values.chartOfAccountId)
            const selectedCC = DEFAULT_COST_CENTERS.find(c => c.id === values.costCenterId)

            // Limpar campos vazios (converter "" para null)
            const cleanedValues = {
                ...values,
                documentNumber: values.documentNumber || null,
                notes: values.notes || null
            };

            console.log("PayableFormVisual: chamando onSave...");
            onSave({
                ...cleanedValues,
                chartOfAccountName: selectedAcc ? selectedAcc.name : '',
                costCenterName: selectedCC ? selectedCC.name : '',
                description: values.title // Sincronizar campos se necessário
            })
        }
    })

    return (
        <div className="payable-form-container p-4 animate__animated animate__fadeIn">
            {!hideTitle && (
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="card-title mb-0">
                        {initialData ? "Editar Despesa" : "Nova Despesa"}
                    </h4>
                </div>
            )}

            <Form onSubmit={formik.handleSubmit}>
                <h5 className="font-size-14 mb-3 text-uppercase fw-bold text-muted border-bottom pb-2">Dados do Pagamento</h5>

                <Row>
                    <Col md={8} className="mb-3">
                        <Label>Descrição da Despesa</Label>
                        <Input
                            name="title"
                            type="text"
                            placeholder="Ex: Conta de Energia, Aluguel..."
                            className="form-control-lg"
                            value={formik.values.title}
                            onChange={formik.handleChange}
                            invalid={!!(formik.touched.title && formik.errors.title)}
                        />
                        {formik.errors.title && <FormFeedback>{formik.errors.title}</FormFeedback>}
                    </Col>
                    <Col md={4} className="mb-3">
                        <Label>Valor Total</Label>
                        <InputGroup>
                            <InputGroupText className="bg-light fw-bold">R$</InputGroupText>
                            <Input
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                className="form-control-lg fw-bold text-dark"
                                value={formik.values.amount}
                                onChange={formik.handleChange}
                                invalid={!!(formik.touched.amount && formik.errors.amount)}
                            />
                        </InputGroup>
                        {formik.errors.amount && <div className="text-danger small mt-1">{formik.errors.amount}</div>}
                    </Col>
                </Row>

                <Row>
                    <Col md={4} className="mb-3">
                        <Label>Fornecedor</Label>
                        <Input
                            name="supplier"
                            type="text"
                            placeholder="Nome do fornecedor..."
                            value={formik.values.supplier}
                            onChange={formik.handleChange}
                        />
                    </Col>
                    <Col md={8} className="mb-3">
                        <Label>Plano de Contas (Natureza)</Label>
                        <Input
                            name="chartOfAccountId"
                            type="select"
                            value={formik.values.chartOfAccountId}
                            onChange={formik.handleChange}
                            invalid={!!(formik.touched.chartOfAccountId && formik.errors.chartOfAccountId)}
                        >
                            <option value="">Selecione...</option>
                            {DEFAULT_CHART_OF_ACCOUNTS
                                .find(g => g.code === '2')?.children
                                .map(group => (
                                    <optgroup label={group.name} key={group.id}>
                                        {group.children.map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.code} - {account.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                        </Input>
                        {formik.errors.chartOfAccountId && <FormFeedback>{formik.errors.chartOfAccountId}</FormFeedback>}
                    </Col>
                </Row>

                <Row>
                    <Col md={4} className="mb-3">
                        <Label>Centro de Custo</Label>
                        <Input
                            name="costCenterId"
                            type="select"
                            value={formik.values.costCenterId}
                            onChange={formik.handleChange}
                            invalid={!!(formik.touched.costCenterId && formik.errors.costCenterId)}
                        >
                            <option value="">Selecione...</option>
                            {DEFAULT_COST_CENTERS.map(cc => (
                                <option key={cc.id} value={cc.id}>{cc.name}</option>
                            ))}
                        </Input>
                        {formik.errors.costCenterId && <FormFeedback>{formik.errors.costCenterId}</FormFeedback>}
                    </Col>
                    <Col md={4} className="mb-3">
                        <Label>Data de Vencimento *</Label>
                        <Input
                            name="dueDate"
                            type="date"
                            value={formik.values.dueDate}
                            onChange={formik.handleChange}
                            invalid={!!(formik.touched.dueDate && formik.errors.dueDate)}
                        />
                        {formik.errors.dueDate && <FormFeedback>{formik.errors.dueDate}</FormFeedback>}
                    </Col>
                    <Col md={4} className="mb-3">
                        <Label>Número do Documento</Label>
                        <Input
                            name="documentNumber"
                            type="text"
                            placeholder="NF, Boleto, Recibo..."
                            value={formik.values.documentNumber}
                            onChange={formik.handleChange}
                        />
                        <small className="text-muted">Ex: NF-12345, Boleto-9876</small>
                    </Col>
                </Row>

                <hr className="my-4" />

                <Row>
                    <Col md={12} className="mb-3">
                        <Label>Observações / Notas</Label>
                        <Input
                            name="notes"
                            type="textarea"
                            rows="3"
                            placeholder="Detalhes adicionais..."
                            value={formik.values.notes}
                            onChange={formik.handleChange}
                        />
                    </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 border-top pt-3">
                    <Button color="secondary" outline onClick={onCancel} type="button">
                        Cancelar
                    </Button>
                    <Button color="success" type="submit">
                        <i className="mdi mdi-check me-1"></i> {initialData ? 'Salvar Alterações' : 'Lançar Despesa'}
                    </Button>
                </div>
            </Form>
        </div>
    )
}
