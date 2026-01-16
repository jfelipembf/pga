import React from "react"
import { Card, CardBody, FormGroup, Input, Label } from "reactstrap"

const RoleColumn = ({
  role,
  permissions,
  onTogglePermission,
  editMode,
  isSelected,
  onSelectRole,
}) => {
  return (
    <Card className="h-100">
      <CardBody>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h6 className="mb-1">{role.label}</h6>
            <p className="text-muted small mb-0">{role.description}</p>
          </div>
          {editMode ? (
            <FormGroup switch className="mb-0">
              <Input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelectRole(role.id)}
              />
            </FormGroup>
          ) : null}
        </div>
        <div className="d-flex flex-column gap-3">
          {permissions.map(permission => {
            const checked = Boolean(role.permissions?.[permission.id])
            const inputId = `${role.id}-${permission.id}`
            return (
              <div key={permission.id} className="d-flex justify-content-between align-items-center">
                <Label className="text-muted small mb-0" htmlFor={inputId}>
                  {permission.shortLabel || permission.label}
                </Label>
                <FormGroup switch className="mb-0">
                  <Input
                    type="switch"
                    id={inputId}
                    role="switch"
                    checked={checked}
                    disabled={editMode}
                    onChange={() => onTogglePermission(role.id, permission.id)}
                  />
                </FormGroup>
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}

export default RoleColumn
