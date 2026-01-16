import React from "react"
import { Button, Spinner } from "reactstrap"

const ButtonLoader = ({
    loading,
    children,
    spinnerSize = "sm",
    spinnerColor = "light",
    disabled,
    ...props
}) => {
    return (
        <Button {...props} disabled={Boolean(disabled) || Boolean(loading)}>
            {loading ? <Spinner size={spinnerSize} color={spinnerColor} /> : children}
        </Button>
    )
}

export default ButtonLoader
