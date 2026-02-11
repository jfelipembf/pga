import React, { useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, Label, Input } from 'reactstrap'
import { useFormik } from 'formik'
import { cashierCloseSchema } from '../../../../validations/financialSchemas'
import { formatCurrency } from '../../../../utils/format'
import ButtonLoader from '../../../../components/Common/ButtonLoader'
import { FormFeedback } from 'reactstrap'

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

    const actual = parseFloat(formik.values.actualBalance || 0)
    const difference = actual - (expectedBalance || 0)

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle} tag="h4">Fechar Caixa</ModalHeader>
            <ModalBody className="p-4">
                <div className="card bg-light border-0 mb-4">
                    <div className="card-body p-3 text-center">
                        <p className="mb-1 text-muted fw-medium text-uppercase font-size-11">Saldo Esperado (Sistema)</p>
                        <h3 className="text-dark fw-bold m-0">{formatCurrency(expectedBalance)}</h3>
                    </div>
                </div>

                <form onSubmit={formik.handleSubmit}>
                    <Label className="mb-1">Valor em Gaveta (Contagem Física)</Label>
                    <div className="input-group mb-2">
                        <span className="input-group-text bg-light border-end-0">R$</span>
                        <Input
                            autoFocus
                            name="actualBalance"
                            type="number"
                            step="0.01"
                            className="border-start-0 ps-0"
                            placeholder="0,00"
                            onChange={formik.handleChange}
                            value={formik.values.actualBalance}
                            invalid={!!(formik.touched.actualBalance && formik.errors.actualBalance)}
                        />
                        {formik.touched.actualBalance && formik.errors.actualBalance && (
                            <FormFeedback className="d-block">{formik.errors.actualBalance}</FormFeedback>
                        )}
                    </div>

                    {/* Feedback visual dinâmico da diferença */}
                    <div className={`alert ${difference === 0 ? 'alert-success' : (difference > 0 ? 'alert-info' : 'alert-danger')} py-2 px-3 mb-4 d-flex justify-content-between align-items-center`}>
                        <span className="font-size-12 fw-medium">
                            {difference === 0 ? 'Valores conferem' : (difference > 0 ? 'Sobra de Caixa' : 'Quebra de Caixa')}
                        </span>
                        <strong className="font-size-14">
                            {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                        </strong>
                    </div>

                    <div className="mb-4">
                        <Label className="mb-1">Observações</Label>
                        <Input
                            name="notes"
                            type="textarea"
                            rows="2"
                            placeholder="Justificativas para quebras ou sobras..."
                            onChange={formik.handleChange}
                            value={formik.values.notes}
                        />
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-light" onClick={toggle}>
                            Cancelar
                        </button>
                        <ButtonLoader
                            type="submit"
                            color="primary"
                            loading={formik.isSubmitting}
                            loadingText="Processando..."
                        >
                            Encerrar Caixa
                        </ButtonLoader>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    )
}

export default CashierCloseModal
