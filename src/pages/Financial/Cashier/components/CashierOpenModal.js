import React, { useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, Label, Input, FormFeedback } from 'reactstrap'
import { useFormik } from 'formik'
import { cashierOpenSchema } from '../../../../validations/financialSchemas'
import ButtonLoader from '../../../../components/Common/ButtonLoader'

const CashierOpenModal = ({ isOpen, toggle, onConfirm }) => {
    const formik = useFormik({
        initialValues: { openingBalance: '0', notes: '' },
        validationSchema: cashierOpenSchema,
        onSubmit: async (values) => {
            await onConfirm(values)
        }
    })

    const { resetForm } = formik
    useEffect(() => {
        if (isOpen) resetForm()
    }, [isOpen, resetForm])

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="sm">
            <ModalHeader toggle={toggle} tag="h4">Abrir Caixa</ModalHeader>
            <ModalBody className="p-4">
                <form onSubmit={formik.handleSubmit}>
                    <p className="text-muted mb-4 text-center">
                        Informe o valor inicial em gaveta para iniciar as operações.
                    </p>

                    <Label className="mb-1">Fundo de Troco (R$)</Label>
                    <div className="input-group mb-4">
                        <span className="input-group-text bg-light border-end-0">R$</span>
                        <Input
                            autoFocus
                            name="openingBalance"
                            type="number"
                            step="0.01"
                            className="border-start-0 ps-0"
                            placeholder="0,00"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.openingBalance}
                            invalid={!!(formik.touched.openingBalance && formik.errors.openingBalance)}
                        />
                        {formik.touched.openingBalance && formik.errors.openingBalance && (
                            <FormFeedback className="d-block mt-1">{formik.errors.openingBalance}</FormFeedback>
                        )}
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-light" onClick={toggle}>
                            Cancelar
                        </button>
                        <ButtonLoader
                            type="submit"
                            color="primary"
                            loading={formik.isSubmitting}
                            loadingText="Abrindo..."
                        >
                            Confirmar Abertura
                        </ButtonLoader>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    )
}

export default CashierOpenModal
