import React, { useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, Button, Label, Input, FormFeedback, Row, Col } from 'reactstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'

export const CashierMovementModal = ({ isOpen, toggle, onSave, type }) => {
    const isIncome = type === 'income'
    const title = isIncome ? 'Novo Suprimento (Entrada)' : 'Nova Sangria (Saída)'
    const color = isIncome ? 'success' : 'danger'

    const formik = useFormik({
        initialValues: {
            amount: '',
            description: '',
            notes: ''
        },
        validationSchema: Yup.object({
            amount: Yup.number().positive('Valor deve ser maior que zero').required('Obrigatório'),
            description: Yup.string().required('Descrição é obrigatória'),
        }),
        onSubmit: (values) => {
            onSave({
                ...values,
                type: type // income ou expense
            })
        }
    })

    // Reset form on open
    useEffect(() => {
        if (isOpen) formik.resetForm()
    }, [isOpen, formik]);

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle} className={`bg-${color} text-white`}>
                {title}
            </ModalHeader>
            <ModalBody className="p-4">
                <form onSubmit={formik.handleSubmit}>
                    <Row>
                        <Col md={12} className="mb-3">
                            <Label className="fw-bold">Valor</Label>
                            <Input
                                name="amount"
                                type="number"
                                step="0.01"
                                className="form-control-lg fw-bold"
                                placeholder="0,00"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.amount}
                                invalid={!!(formik.touched.amount && formik.errors.amount)}
                            />
                            {formik.touched.amount && formik.errors.amount && (
                                <FormFeedback>{formik.errors.amount}</FormFeedback>
                            )}
                        </Col>
                        <Col md={12} className="mb-3">
                            <Label className="fw-bold">Descrição</Label>
                            <Input
                                name="description"
                                type="text"
                                placeholder={isIncome ? "Ex: Troco inicial extra" : "Ex: Pagamento Motoboy"}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.description}
                                invalid={!!(formik.touched.description && formik.errors.description)}
                            />
                            {formik.touched.description && formik.errors.description && (
                                <FormFeedback>{formik.errors.description}</FormFeedback>
                            )}
                        </Col>
                        <Col md={12} className="mb-4">
                            <Label>Observações (Opcional)</Label>
                            <Input
                                name="notes"
                                type="textarea"
                                rows="2"
                                onChange={formik.handleChange}
                                value={formik.values.notes}
                            />
                        </Col>
                    </Row>
                    <Button type="submit" color={color} block size="lg" className="fw-bold" disabled={formik.isSubmitting}>
                        CONFIRMAR {isIncome ? 'ENTRADA' : 'SAÍDA'}
                    </Button>
                </form>
            </ModalBody>
        </Modal>
    )
}
