import React, { useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, Label, Input, FormFeedback, Row, Col } from 'reactstrap'
import ButtonLoader from "../../../../components/Common/ButtonLoader"
import { useFormik } from 'formik'
import { CashierMovementSchema } from '../../../../data/schemas/Financial/CashierSessionSchema'

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
        validationSchema: CashierMovementSchema,
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
                            <Label>Valor</Label>
                            <Input
                                name="amount"
                                type="number"
                                step="0.01"
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
                            <Label>Descrição</Label>
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
                    <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-light" onClick={toggle}>
                            Cancelar
                        </button>
                        <ButtonLoader
                            type="submit"
                            color={color}
                            loading={formik.isSubmitting}
                            loadingText="Processando..."
                        >
                            Confirmar {isIncome ? 'Entrada' : 'Saída'}
                        </ButtonLoader>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    )
}
