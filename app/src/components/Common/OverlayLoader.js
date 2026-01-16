import React from "react"
import { Spinner } from "reactstrap"

const OverlayLoader = ({ show, label = null, zIndex = 2 }) => {
  if (!show) return null

  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center"
      style={{
        position: "absolute",
        inset: 0,
        zIndex,
        background: "rgba(255,255,255,0.35)",
      }}
    >
      <Spinner color="primary" />
      {label ? <div className="text-muted mt-2">{label}</div> : null}
    </div>
  )
}

export default OverlayLoader
