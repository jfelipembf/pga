import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Input, ListGroup, ListGroupItem } from 'reactstrap'

const ClientAddSearch = ({
    value,
    onChange,
    disabled,
    candidates = [],
    onSelect,
    showNoResults,
    noResultsLabel = "Nenhum resultado encontrado."
}) => {
    const [showDropdown, setShowDropdown] = useState(false)

    const handleChange = (e) => {
        onChange(e.target.value)
        setShowDropdown(true)
    }

    const handleSelect = (candidate) => {
        onSelect(candidate)
        setShowDropdown(false)
    }

    const handleBlur = () => {
        // Delay hide to allow click
        setTimeout(() => setShowDropdown(false), 200)
    }

    return (
        <div className="position-relative">
            <div className="input-group">
                <span className="input-group-text border-end-0 bg-white text-muted">
                    <i className="mdi mdi-account-search-outline"></i>
                </span>
                <Input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Buscar aluno para adicionar..."
                    value={value}
                    onChange={handleChange}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={handleBlur}
                    disabled={disabled}
                />
            </div>

            {showDropdown && value && (
                <div className="position-absolute w-100 bg-white shadow-lg rounded mt-1 overflow-auto"
                    style={{ zIndex: 1050, maxHeight: '200px', border: '1px solid #eee' }}>
                    <ListGroup flush>
                        {candidates.length > 0 ? (
                            candidates.map(candidate => (
                                <ListGroupItem
                                    key={candidate.id}
                                    action
                                    tag="button"
                                    onClick={() => handleSelect(candidate)}
                                    className="border-0 border-bottom"
                                >
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-xs me-2">
                                            <span className="avatar-title rounded-circle bg-light text-primary font-size-12">
                                                {candidate.photo ? (
                                                    <img src={candidate.photo} alt="" className="rounded-circle w-100 h-100" />
                                                ) : (
                                                    (candidate.name || '?').charAt(0).toUpperCase()
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 font-size-14 text-dark">{candidate.name}</h6>
                                            <small className="text-muted">{candidate.email || 'Sem email'}</small>
                                        </div>
                                    </div>
                                </ListGroupItem>
                            ))
                        ) : (
                            showNoResults && (
                                <div className="p-3 text-center text-muted">
                                    <small>{noResultsLabel}</small>
                                </div>
                            )
                        )}
                    </ListGroup>
                </div>
            )}
        </div>
    )
}

ClientAddSearch.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    candidates: PropTypes.array,
    onSelect: PropTypes.func,
    showNoResults: PropTypes.bool,
    noResultsLabel: PropTypes.string
}

export default ClientAddSearch
