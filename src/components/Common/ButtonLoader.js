import React from "react"
import { Button, Spinner } from "reactstrap"
import PropTypes from "prop-types"

const ButtonLoader = ({
  loading = false,
  loadingText = "Carregando...",
  children,
  disabled,
  onClick,
  color = "primary",
  size,
  className = "",
  type = "button",
  ...rest
}) => {
  return (
    <Button
      color={color}
      size={size}
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="me-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

ButtonLoader.propTypes = {
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  color: PropTypes.string,
  size: PropTypes.string,
  className: PropTypes.string,
  type: PropTypes.string
}

export default ButtonLoader
