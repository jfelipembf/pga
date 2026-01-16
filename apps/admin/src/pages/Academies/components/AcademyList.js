import React from "react"
import BasicTable from "../../../common/BasicTable"
import { Button, UncontrolledTooltip } from "reactstrap"
import PropTypes from "prop-types"

const AcademyList = ({ academies, onView, onNewClick }) => {
    const columns = [
        {
            label: "Foto",
            key: "photo",
            render: (item) => (
                <div style={{ width: '50px', height: '50px' }}>
                    {item.photo ? (
                        <img
                            src={item.photo}
                            alt="Foto"
                            className="rounded-circle"
                            style={{ height: "100%", width: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <div className="rounded-circle bg-light d-flex justify-content-center align-items-center" style={{ width: '100%', height: '100%' }}>
                            <i className="mdi mdi-domain fs-2 text-secondary"></i>
                        </div>
                    )}
                </div>
            ),
        },
        {
            label: "Academia",
            key: "tradeName",
            render: (item) => (
                <div>
                    <h5 className="font-size-14 mb-1">{item.tradeName || item.name}</h5>
                    <small className="text-muted">{item.slug}</small>
                </div>
            )
        },
        {
            label: "Responsável",
            key: "contactEmail",
            render: (item) => item.contactEmail || "-"
        },
        {
            label: "Cidade/UF",
            key: "city",
            render: (item) => {
                const addr = item.address || {};
                return `${addr.city || '-'} / ${addr.state || '-'}`
            }
        },
        {
            label: "Ações",
            key: "actions",
            render: (item) => (
                <div className="d-flex gap-2">
                    <Button
                        color="light"
                        size="sm"
                        onClick={() => onView(item)}
                        id={`view-tooltip-${item.id}`}
                    >
                        <i className="mdi mdi-eye" />
                    </Button>
                    <UncontrolledTooltip placement="top" target={`view-tooltip-${item.id}`}>
                        Ver detalhes
                    </UncontrolledTooltip>
                </div>
            ),
        },
    ]

    return (
        <BasicTable
            columns={columns}
            data={academies}
            onNewClick={onNewClick}
            searchPlaceholder="Buscar academias..."
        />
    )
}

AcademyList.propTypes = {
    academies: PropTypes.array.isRequired,
    onView: PropTypes.func,
    onNewClick: PropTypes.func
}

export default AcademyList
