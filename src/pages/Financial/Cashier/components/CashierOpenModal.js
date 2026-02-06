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
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>Abrir Caixa</ModalHeader>
            <ModalBody className="p-4">
                <form onSubmit={formik.handleSubmit}>
                    <div className="mb-4">
                        <Label className="fw-bold">Saldo Inicial (Fundo de Troco)</Label>
                        <Input
                            name="openingBalance"
                            type="number"
                            step="0.01"
                            className="form-control-lg text-primary fw-bold"
                            placeholder="0,00"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.openingBalance}
                            invalid={!!(formik.touched.openingBalance && formik.errors.openingBalance)}
                        />
                        {formik.touched.openingBalance && formik.errors.openingBalance && (
                            <FormFeedback>{formik.errors.openingBalance}</FormFeedback>
                        )}
                    </div>
                    <ButtonLoader
                        type="submit"
                        color="primary"
                        block
                        size="lg"
                        className="fw-bold"
                        loading={formik.isSubmitting}
                        loadingText="Abrindo..."
                    >
                        CONFIRMAR ABERTURA
                    </ButtonLoader>
                </form>
            </ModalBody>
        </Modal>
    )
}

export default CashierOpenModal
