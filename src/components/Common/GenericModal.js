import React from "react"
import { Modal } from "reactstrap"
import PropTypes from "prop-types"

const GenericModal = ({
    isOpen,
    toggle,
    title,
    children,
    size = "md",
    className,
    footer,
    centered = true,
    scrollable = false,
    ...props // Pass through other props like style, etc.
}) => {
    return (
        <Modal
            isOpen={isOpen}
            toggle={toggle}
            size={size}
            centered={centered}
            scrollable={scrollable}
            className={className}
            {...props}
        >
            {title && (
                <div className="modal-header">
                    <h5 className="modal-title mt-0">{title}</h5>
                    <button
                        type="button"
                        onClick={toggle}
                        className="btn-close"
                        data-dismiss="modal"
                        aria-label="Close"
                    ></button>
                </div>
            )}

            <div className="modal-body">
                {children}
            </div>

            {footer && (
                <div className="modal-footer">
                    {footer}
                </div>
            )}
        </Modal>
    )
}

GenericModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    toggle: PropTypes.func.isRequired,
    title: PropTypes.string,
    children: PropTypes.node,
    size: PropTypes.string,
    className: PropTypes.string,
    footer: PropTypes.node,
    centered: PropTypes.bool,
    scrollable: PropTypes.bool
}

export default GenericModal
