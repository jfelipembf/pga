import React, { useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, Label, Input } from 'reactstrap'
import { useFormik } from 'formik'
import { cashierCloseSchema } from '../../../../validations/financialSchemas'
import { formatCurrency } from '../../../../utils/format'
import ButtonLoader from '../../../../components/Common/ButtonLoader'

const CashierCloseModal = ({ isOpen, toggle, onConfirm, expectedBalance }) => {
    const formik = useFormik({
        initialValues: { actualBalance: '', notes: '' },
        validationSchema: cashierCloseSchema,
        onSubmit: async (values) => {
            await onConfirm(values)
        }
    })

    const { resetForm } = formik
    useEffect(() => {
        if (isOpen) resetForm()
    }, [isOpen, resetForm])

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>Fechar Caixa</ModalHeader>
            <ModalBody className="p-4">
                <div className="text-center mb-4 p-3">
                    <p className="mb-1 text-muted text-uppercase font-size-11 fw-bold">Saldo Esperado em Gaveta</p>
                    <h3 className="text-dark fw-bold m-0">{formatCurrency(expectedBalance)}</h3>
                </div>
                <form onSubmit={formik.handleSubmit}>
                    <div className="mb-3">
                        <Label className="fw-bold">Valor Conferido Fisicamente</Label>
                        <Input
                            name="actualBalance"
                            type="number"
                            step="0.01"
                            className="form-control-lg fw-bold"
                            placeholder="0,00"
                            onChange={formik.handleChange}
                            value={formik.values.actualBalance}
                            invalid={!!(formik.touched.actualBalance && formik.errors.actualBalance)}
                        />
                    </div>
                    <div className="mb-4">
                        <Label className="fw-bold">Observações do Fechamento</Label>
                        <Input
                            name="notes"
                            type="textarea"
                            rows="3"
                            placeholder="Caso haja diferença, explique aqui..."
                            onChange={formik.handleChange}
                            value={formik.values.notes}
                        />
                    </div>
                    <ButtonLoader
                        type="submit"
                        color="danger"
                        block
                        size="lg"
                        className="fw-bold"
                        loading={formik.isSubmitting}
                        loadingText="Fechando..."
                    >
                        CONFIRMAR FECHAMENTO E TRAVAR
                    </ButtonLoader>
                </form>
            </ModalBody>
        </Modal>
    )
}

export default CashierCloseModal
