import React, { useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, FormGroup, Label, Input } from 'reactstrap'
import ButtonLoader from '../../../../components/Common/ButtonLoader'

const ChangePasswordModal = ({ isOpen, toggle, onConfirm, loading }) => {
    const [newPassword, setNewPassword] = useState('')

    const handleSubmit = async () => {
        if (newPassword.length < 6) return alert('A senha deve ter no mínimo 6 caracteres')
        await onConfirm(newPassword)
        setNewPassword('')
    }

    return (
        <Modal
            isOpen={isOpen}
            toggle={toggle}
            centered
            fade={false}
        >
            <ModalHeader toggle={toggle}>
                Alterar Senha de Acesso
            </ModalHeader>
            <ModalBody>
                <p className="text-muted mb-4">
                    A nova senha deve ter no mínimo 6 caracteres. O colaborador deverá utilizá-la em seu próximo login.
                </p>
                <FormGroup>
                    <Label>Nova Senha</Label>
                    <Input
                        type="password"
                        placeholder="Digite a nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </FormGroup>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" outline onClick={toggle}>Cancelar</Button>
                <ButtonLoader
                    color="primary"
                    onClick={handleSubmit}
                    loading={loading}
                    loadingText="Alterando..."
                >
                    Confirmar Alteração
                </ButtonLoader>
            </ModalFooter>
        </Modal>
    )
}

export default ChangePasswordModal
