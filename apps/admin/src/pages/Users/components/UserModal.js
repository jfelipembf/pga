import React from "react"
import { Modal, ModalHeader, ModalBody } from "reactstrap"
import PersonalDataForm from "../../../components/Common/PersonalDataForm"
import PropTypes from "prop-types"

const UserModal = ({ isOpen, toggle, user, onSave }) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
            <ModalHeader toggle={toggle}>
                {user ? "Editar Usuário" : "Novo Usuário"}
            </ModalHeader>
            <ModalBody>
                <PersonalDataForm
                    initialValues={user || {}}
                    onSubmit={onSave}
                />
            </ModalBody>
        </Modal>
    )
}

UserModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    toggle: PropTypes.func.isRequired,
    user: PropTypes.object,
    onSave: PropTypes.func.isRequired,
}

export default UserModal
