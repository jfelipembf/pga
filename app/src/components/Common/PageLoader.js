import React from "react"
import { Spinner } from "reactstrap"

const PageLoader = ({ minHeight = "calc(100vh - 140px)" }) => {
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center w-100"
      style={{ minHeight: minHeight }}
    >
      <Spinner color="primary" />
      <div className="text-muted mt-2">Carregando...</div>
    </div>
  )
}

export default PageLoader
