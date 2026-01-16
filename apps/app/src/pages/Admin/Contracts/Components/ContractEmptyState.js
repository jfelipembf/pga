import React from "react"
import { Card, CardBody } from "reactstrap"

export default function ContractEmptyState() {
  return (
    <Card className="shadow-sm h-100">
      <CardBody className="d-flex flex-column align-items-center justify-content-center text-center text-muted">
        <i className="mdi mdi-file-document-outline display-4 mb-3" />
        <p className="mb-0">Selecione um contrato para visualizar ou editar.</p>
      </CardBody>
    </Card>
  )
}
