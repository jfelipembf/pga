import React from "react"
import { Modal, ModalHeader, ModalBody } from "reactstrap"
import AcademyForm from "./AcademyForm"
import PropTypes from "prop-types"

const AcademyModal = ({ isOpen, toggle, onSave, submitting, onCheckSlug }) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" centered>
            <ModalHeader toggle={toggle}>
                Nova Academia
            </ModalHeader>
            <ModalBody>
                <AcademyForm
                    onSubmit={onSave}
                    submitting={submitting}
                    onCheckSlug={onCheckSlug}
                />
            </ModalBody>
        </Modal>
    )
}

AcademyModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    toggle: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    submitting: PropTypes.bool,
    onCheckSlug: PropTypes.func.isRequired
}

export default AcademyModal
