import React, { useState } from "react"
import PropTypes from "prop-types"
import { Button, Card, CardBody, CardHeader, Input } from "reactstrap"

// Generic CRM List Component


// Helper: Date Object -> "YYYY-MM-DD"
const toInputDate = (date) => {
  if (!date) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Helper: "YYYY-MM-DD" -> Date Object (Local Time 00:00)
const fromInputDate = (str) => {
  if (!str) return null
  const [y, m, d] = str.split("-").map(Number)
  return new Date(y, m - 1, d)
}

const DateFilter = ({ dateRange, onSearch }) => {
  // Local state for inputs (strings YYYY-MM-DD)
  const [localStart, setLocalStart] = useState(toInputDate(dateRange[0]))
  const [localEnd, setLocalEnd] = useState(toInputDate(dateRange[1]))

  const handleSearch = () => {
    // Convert strings back to Date objects
    const s = fromInputDate(localStart)
    const e = fromInputDate(localEnd)
    onSearch([s, e])
  }

  return (
    <div className="d-flex align-items-center gap-2">
      <div className="d-flex align-items-center gap-1">
        <small className="text-muted d-none d-md-block">De:</small>
        <Input
          type="date"
          bsSize="sm"
          value={localStart}
          onChange={e => setLocalStart(e.target.value)}
          style={{ maxWidth: "135px" }}
        />
      </div>
      <div className="d-flex align-items-center gap-1">
        <small className="text-muted d-none d-md-block">Até:</small>
        <Input
          type="date"
          bsSize="sm"
          value={localEnd}
          onChange={e => setLocalEnd(e.target.value)}
          style={{ maxWidth: "135px" }}
        />
      </div>
      <Button color="primary" size="sm" onClick={handleSearch}>
        <i className="mdi mdi-magnify" />
      </Button>
    </div>
  )
}

const CrmList = ({ title, description, clients = [], selectedId, onSelect, dateRange = [null, null], onChangeRange, loading = false }) => {
  return (
    <Card className="shadow-sm h-100 position-relative">
      <CardHeader className="d-flex align-items-start justify-content-between gap-2">
        <div className="me-auto">
          <h5 className="mb-0">{title}</h5>
          {description && <p className="text-muted small mb-0">{description}</p>}
        </div>
        <div className="ms-auto">
          <DateFilter
            dateRange={dateRange || [null, null]}
            onSearch={onChangeRange}
          />
        </div>
      </CardHeader>

      <CardBody className="p-0 position-relative" style={{ minHeight: "200px" }}>


        {clients.length ? (
          <div className="d-flex flex-column">
            {clients.map(client => (
              <div
                key={client.id}
                className={`d-flex align-items-center gap-3 px-3 py-2 border-top ${client.id === selectedId ? "border-primary border-2" : "border-light"
                  } bg-white`}
              >
                <div
                  className="rounded-circle bg-light flex-shrink-0"
                  style={{
                    width: 60,
                    height: 60,
                    backgroundImage: `url(${client.photo})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="flex-grow-1">
                  <div className="fw-semibold">{client.name}</div>
                  <div className="text-muted small">
                    {client.note || client.statusLabel || "Cliente"}
                    {client.referenceLabel ? ` · ${client.referenceLabel}` : ""}
                  </div>
                </div>
                <Button color={client.id === selectedId ? "primary" : "light"} size="sm" onClick={() => onSelect?.(client.id)}>
                  Ver
                </Button>
              </div>
            ))}
          </div>
        ) : (
          !loading && <div className="text-center text-muted py-5">Nenhum cliente encontrado no período.</div>
        )}
      </CardBody>
    </Card>
  )
}

CrmList.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      photo: PropTypes.string,
      statusLabel: PropTypes.string,
      referenceLabel: PropTypes.string,
      note: PropTypes.string,
    })
  ),
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func,
  dateRange: PropTypes.array,
  onChangeRange: PropTypes.func,
  loading: PropTypes.bool,
}



export default CrmList
