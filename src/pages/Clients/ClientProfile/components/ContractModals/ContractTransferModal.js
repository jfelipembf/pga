import React, { useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input } from 'reactstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'

const ContractTransferModal = ({ isOpen, toggle, contract, onConfirm }) => {

    // Simulação de busca de clientes (Na prática viria de um serviço)
    const [searchTerm, setSearchTerm] = useState('')

    const formik = useFormik({
        initialValues: {
            targetClientId: '',
            transferFee: 0,
            notes: ''
        },
        validationSchema: Yup.object({
            targetClientId: Yup.string().required('Selecione o aluno que receberá o contrato'),
            notes: Yup.string().min(5, 'Descreva os termos da transferência').required('Obrigatório'),
        }),
        onSubmit: (values) => {
            onConfirm(values)
        }
    })

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle} className="border-bottom text-dark">
                <i className="mdi mdi-account-switch-outline me-2 text-primary"></i>
                Transferir Titularidade
            </ModalHeader>
            <Form onSubmit={formik.handleSubmit}>
                <ModalBody className="p-4">
                    <FormGroup className="mb-4">
                        <Label className="fw-semibold text-dark">Novo Titular</Label>
                        <div className="position-relative">
                            <Input
                                type="text"
                                className="form-control-lg pe-5"
                                placeholder="Digite nome, CPF ou Email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <i className="mdi mdi-magnify position-absolute top-50 end-0 translate-middle-y me-3 fs-4 text-muted"></i>
                        </div>
                        <div className="text-muted font-size-12 mt-2">
                            <i className="mdi mdi-help-circle-outline me-1"></i>
                            O aluno destino deve estar cadastrado como <strong>Lead</strong> ou <strong>Inativo</strong>.
                        </div>
                    </FormGroup>

                    <FormGroup className="mb-4">
                        <Label className="fw-semibold text-dark">Taxa de Transferência (Opcional)</Label>
                        <div className="input-group input-group-lg shadow-none">
                            <span className="input-group-text bg-light border-end-0">R$</span>
                            <Input
                                type="number"
                                name="transferFee"
                                className="border-start-0"
                                placeholder="0,00"
                                onChange={formik.handleChange}
                                value={formik.values.transferFee}
                            />
                        </div>
                    </FormGroup>

                    <FormGroup className="mb-0">
                        <Label className="fw-semibold text-dark">Termos / Observações</Label>
                        <Input
                            type="textarea"
                            name="notes"
                            rows="3"
                            placeholder="Descreva as condições da transferência..."
                            onChange={formik.handleChange}
                            value={formik.values.notes}
                            invalid={formik.touched.notes && !!formik.errors.notes}
                        />
                    </FormGroup>
                </ModalBody>
                <ModalFooter className="bg-light border-top">
                    <Button color="secondary" outline className="btn-rounded" onClick={toggle}>Cancelar</Button>
                    <Button color="primary" type="submit" className="btn-rounded px-4" disabled={formik.isSubmitting || !searchTerm}>
                        Confirmar Transferência
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    )
}

export default ContractTransferModal
