import React from "react"
import PropTypes from "prop-types"
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap"
import ButtonLoader from "./ButtonLoader"

/**
 * ConfirmDialog - modal simples de confirmação.
 */
const ConfirmDialog = ({
  isOpen = false,
  title = "Confirmar",
  message = "Deseja confirmar esta ação?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm = () => { },
  onCancel = () => { },
  confirmColor = "danger",
  loading = false,
}) => (
  <Modal isOpen={isOpen} toggle={!loading ? onCancel : undefined} centered>
    <ModalHeader toggle={!loading ? onCancel : undefined}>{title || "Confirmar"}</ModalHeader>
    <ModalBody>{message || "Deseja confirmar esta ação?"}</ModalBody>
    <ModalFooter>
      <Button color="secondary" onClick={onCancel} disabled={loading}>
        {cancelText || "Cancelar"}
      </Button>
      <ButtonLoader color={confirmColor || "danger"} onClick={onConfirm} loading={loading}>
        {confirmText || "Confirmar"}
      </ButtonLoader>
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
