import React from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from "reactstrap"
import PropTypes from "prop-types"

/**
 * Componente genérico para diálogos de confirmação.
 */
const ConfirmDialog = ({
    isOpen,
    toggle,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    confirmColor = "primary",
    onConfirm,
    loading = false
}) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>
                <i className="mdi mdi-alert-outline text-warning me-2"></i>
                {title}
            </ModalHeader>
            <ModalBody>
                {description}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle} disabled={loading}>
                    {cancelText}
                </Button>
                <Button color={confirmColor} onClick={onConfirm} disabled={loading} className="px-4">
                    {loading ? (
                        <div className="d-flex align-items-center gap-2">
                            <Spinner size="sm" /> Aguarde...
                        </div>
                    ) : (
                        confirmText
                    )}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

ConfirmDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    toggle: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    confirmColor: PropTypes.string,
    onConfirm: PropTypes.func.isRequired,
    loading: PropTypes.bool
}

export default ConfirmDialog
