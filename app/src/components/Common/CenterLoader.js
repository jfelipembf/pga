import React from "react"
import { Spinner } from "reactstrap"

const CenterLoader = ({ label = "Carregando..." }) => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: 200 }}>
      <Spinner color="primary" />
      {label && <div className="text-muted mt-2">{label}</div>}
    </div>
  )
}

export default CenterLoader
