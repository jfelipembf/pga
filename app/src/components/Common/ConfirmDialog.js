import React from "react"
import PropTypes from "prop-types"
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap"

/**
 * ConfirmDialog - modal simples de confirmação.
 */
const ConfirmDialog = ({
  isOpen = false,
  title = "Confirmar",
  message = "Deseja confirmar esta ação?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm = () => {},
  onCancel = () => {},
  confirmColor = "danger",
}) => (
  <Modal isOpen={isOpen} toggle={onCancel} centered>
    <ModalHeader toggle={onCancel}>{title || "Confirmar"}</ModalHeader>
    <ModalBody>{message || "Deseja confirmar esta ação?"}</ModalBody>
    <ModalFooter>
      <Button color="secondary" onClick={onCancel}>
        {cancelText || "Cancelar"}
      </Button>
      <Button color={confirmColor || "danger"} onClick={onConfirm}>
        {confirmText || "Confirmar"}
      </Button>
    </ModalFooter>
  </Modal>
)

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.node,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmColor: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
}

export default ConfirmDialog
