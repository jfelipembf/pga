import React from "react"
import PropTypes from "prop-types"
import { Badge, Button, Card, CardBody, CardHeader } from "reactstrap"

const CrmDetail = ({ client }) => {
  if (!client) {
    return (
      <Card className="shadow-sm h-100">
        <CardBody className="d-flex align-items-center justify-content-center text-muted">
          Selecione um cliente para ver os detalhes.
        </CardBody>
      </Card>
    )
  }

  const handleWhatsApp = () => {
    if (!client.phone) return
    // Remove tudo que não é dígito
    const phone = client.phone.replace(/\D/g, "")
    // Se não tiver código do país (menos de 12 dígitos, e.g. 11999999999 = 11), adiciona 55
    const fullPhone = phone.length <= 11 ? `55${phone}` : phone
    window.open(`https://wa.me/${fullPhone}`, "_blank")
  }

  return (
    <Card className="shadow-sm h-100">
      <CardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle flex-shrink-0"
            style={{
              width: 72,
              height: 72,
              backgroundImage: `url(${client.photo})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "3px solid #fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            }}
          />
          <div>
            <h5 className="mb-1">{client.name}</h5>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {client.statusLabel && (
                <Badge color={client.statusColor || "secondary"} pill className="px-3 py-2">
                  {client.statusLabel}
                </Badge>
              )}
              {client.tag && <span className="text-muted small">{client.tag}</span>}
            </div>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button
            color="success"
            className="p-2 d-flex align-items-center gap-2"
            title="WhatsApp"
            onClick={handleWhatsApp}
            disabled={!client.phone}
          >
            <i className="mdi mdi-whatsapp fs-5" />
            <span className="d-none d-md-inline">WhatsApp</span>
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="d-flex flex-column gap-2">
          {client.email && (
            <div className="d-flex align-items-center gap-2">
              <i className="mdi mdi-email-outline text-muted" />
              <span className="text-muted small">Email</span>
              <span className="fw-semibold">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="d-flex align-items-center gap-2">
              <i className="mdi mdi-phone-outline text-muted" />
              <span className="text-muted small">Telefone</span>
              <span className="fw-semibold">{client.phone}</span>
            </div>
          )}
          {client.segmentInfo && (
            <div className="d-flex align-items-center gap-2">
              <i className="mdi mdi-calendar-outline text-muted" />
              <span className="text-muted small">Período</span>
              <span className="fw-semibold">{client.segmentInfo}</span>
            </div>
          )}
          {client.contract && (
            <div className="d-flex align-items-center gap-2">
              <i className="mdi mdi-file-document-outline text-muted" />
              <span className="text-muted small">Contrato</span>
              <span className="fw-semibold">{client.contract}</span>
            </div>
          )}
          {client.balance && (
            <div className="d-flex align-items-center gap-2">
              <i className="mdi mdi-cash-multiple text-muted" />
              <span className="text-muted small">Financeiro</span>
              <span className="fw-semibold">{client.balance}</span>
            </div>
          )}
          {client.notes && (
            <div className="d-flex align-items-start gap-2">
              <i className="mdi mdi-information-outline text-muted mt-1" />
              <div>
                <span className="text-muted small d-block">Observações</span>
                <span className="fw-semibold">{client.notes}</span>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

CrmDetail.propTypes = {
  client: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    photo: PropTypes.string,
    statusLabel: PropTypes.string,
    statusColor: PropTypes.string,
    tag: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    segmentInfo: PropTypes.string,
    contract: PropTypes.string,
    balance: PropTypes.string,
    notes: PropTypes.string,
  }),
}

export default CrmDetail
