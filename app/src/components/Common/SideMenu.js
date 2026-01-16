import PropTypes from "prop-types"
import React from "react"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ListGroup,
  ListGroupItem,
} from "reactstrap"

const SideMenu = ({
  title,
  description,
  items,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  emptyLabel,
  headerActions,
  extraControls,
  onDragStart,
  onDragOver,
  onDragEnd,
  hideArrow, // NEW
}) => {
  const renderItemActions = item => {
    if (!onEdit && !onDelete) return null
    return (
      <div className="d-flex gap-1">
        {onEdit && (
          <Button
            size="sm"
            color="link"
            className="px-2 text-primary"
            title="Editar"
            aria-label="Editar"
            onClick={e => {
              e.stopPropagation()
              onEdit?.(item.id)
            }}
          >
            <i className="mdi mdi-pencil-outline fs-5" />
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            color="link"
            className="px-2 text-danger"
            title="Excluir"
            aria-label="Excluir"
            onClick={e => {
              e.stopPropagation()
              onDelete?.(item.id)
            }}
          >
            <i className="mdi mdi-trash-can-outline fs-5" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="h-100 shadow-sm">
      {(title || description || headerActions || extraControls) && (
        <CardHeader className="bg-white border-0 pb-0">
          <div className="d-flex flex-column gap-3">
            {(title || description || headerActions) && (
              <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                <div>
                  {title && <h5 className="mb-1">{title}</h5>}
                  {description && <p className="text-muted small mb-0">{description}</p>}
                </div>
                {headerActions}
              </div>
            )}
            {extraControls}
          </div>
        </CardHeader>
      )}
      <CardBody className="pt-3">
        {items?.length ? (
          <ListGroup flush className="side-menu__list">
            {items.map((item, index) => {
              if (item.isHeader) {
                return (
                  <ListGroupItem key={item.id} className="border-0 px-2 py-2 bg-light">
                    <small className="fw-bold text-uppercase text-muted">{item.title}</small>
                  </ListGroupItem>
                )
              }

              const isActive = item.id === selectedId
              return (
                <ListGroupItem
                  key={item.id}
                  action
                  onClick={() => onSelect?.(item.id)}
                  className={`border-0 px-2 py-3 side-menu__item ${isActive ? "side-menu__item--active" : ""
                    }`}
                  draggable={item.draggable}
                  onDragStart={() => onDragStart?.(item.id)}
                  onDragOver={e => {
                    if (item.draggable) {
                      e.preventDefault()
                      onDragOver?.(e, item.id)
                    }
                  }}
                  onDragEnd={onDragEnd}
                >
                  <div className="d-flex align-items-center gap-2 w-100">
                    {item.draggable && (
                      <i className="mdi mdi-drag text-muted fs-4 cursor-grab" style={{ cursor: "grab" }} />
                    )}
                    <span className="side-menu__index fw-semibold text-muted small">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between gap-3">
                        <div>
                          <div className="fw-semibold">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-muted small">{item.subtitle}</div>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {item.meta && (
                            <span className="badge bg-light text-dark">{item.meta}</span>
                          )}
                          {!hideArrow && <i className="mdi mdi-chevron-right text-muted" />}
                          {renderItemActions(item)}
                        </div>
                      </div>
                    </div>
                  </div>
                </ListGroupItem>
              )
            })}
          </ListGroup>
        ) : (
          <div className="text-center py-5">
            <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
              <i className="mdi mdi-playlist-star text-muted fs-4" />
            </div>
            <p className="text-muted mb-0">{emptyLabel || "Nenhum item cadastrado."}</p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

SideMenu.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      meta: PropTypes.string,
      helper: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  emptyLabel: PropTypes.string,
  headerActions: PropTypes.node,
  extraControls: PropTypes.node,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDragEnd: PropTypes.func,
  hideArrow: PropTypes.bool,
}

export default SideMenu
