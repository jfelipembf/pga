import React from "react"
import PropTypes from "prop-types"
import { Input, InputGroup, InputGroupText } from "reactstrap"

const ClientAddSearch = ({
  value,
  onChange,
  disabled = false,
  candidates = [],
  onSelect,
  showNoResults = false,
  noResultsLabel = "Nenhum cliente encontrado.",
}) => {
  return (
    <div className="position-relative">
      <InputGroup className="shadow-sm">
        <InputGroupText className="bg-white border-end-0">
          <i className="mdi mdi-magnify text-muted" />
        </InputGroupText>
        <Input
          className="border-start-0 ps-0"
          placeholder="Digite para buscar e adicionar à lista..."
          style={{ padding: "12px" }}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
        />
      </InputGroup>

      {Array.isArray(candidates) && candidates.length > 0 && (
        <div
          className="list-group position-absolute w-100 shadow-sm"
          style={{ zIndex: 20, maxHeight: 260, overflowY: "auto" }}
        >
          {candidates.map(c => (
            <button
              key={String(c.id)}
              type="button"
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              onClick={() => onSelect(c)}
            >
              <span className="text-truncate">{c.name}</span>
              <span className="text-muted small ms-2">ID: {c.idGym}</span>
            </button>
          ))}
        </div>
      )}

      {showNoResults ? <div className="mt-2 text-muted small">{noResultsLabel}</div> : null}
    </div>
  )
}

ClientAddSearch.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  candidates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      idGym: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  onSelect: PropTypes.func.isRequired,
  showNoResults: PropTypes.bool,
  noResultsLabel: PropTypes.string,
}



export default ClientAddSearch
