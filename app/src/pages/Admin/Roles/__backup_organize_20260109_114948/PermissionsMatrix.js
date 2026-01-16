import React from "react"
import { Card, CardBody, CardHeader, FormGroup, Input } from "reactstrap"

const PermissionsMatrix = ({
  permissions = [],
  roles = [],
  editMode,
  selectedRoles,
  onSelectRole,
  onTogglePermission,
  actions,
}) => {
  return (
    <Card className="roles-matrix-card">
      <CardHeader className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
        {actions ? <div className="d-flex flex-wrap gap-2 ms-auto">{actions}</div> : null}
      </CardHeader>
      <CardBody className="p-0 pb-4">
        <div className="table-responsive roles-matrix">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: "280px" }}>Permissões</th>
                {roles.map(role => (
                  <th key={role.id} className="text-center">
                    <div className="fw-semibold text-dark">{role.label}</div>
                    {editMode ? (
                      <FormGroup switch className="mb-0 d-inline-flex align-items-center">
                        <Input
                          type="checkbox"
                          checked={selectedRoles.has(role.id)}
                          onChange={() => onSelectRole(role.id)}
                        />
                      </FormGroup>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map(permission => (
                <tr key={permission.id}>
                  <td>
                    <div className="fw-semibold">{permission.label}</div>
                  </td>
                  {roles.map(role => {
                    const checked = Boolean(role.permissions?.[permission.id])
                    const inputId = `${role.id}-${permission.id}`
                    return (
                      <td key={inputId} className="text-center">
                        <FormGroup switch className="mb-0 d-inline-flex align-items-center">
                          <Input
                            type="switch"
                            id={inputId}
                            checked={checked}
                            disabled={editMode}
                            onChange={() => onTogglePermission(role.id, permission.id)}
                          />
                        </FormGroup>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}

export default PermissionsMatrix
