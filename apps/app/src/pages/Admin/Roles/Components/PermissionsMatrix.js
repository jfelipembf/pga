import React from "react"
import { Card, CardBody, CardHeader, FormGroup, Input } from "reactstrap"
import { BASE_ROLE_IDS } from "../Constants"

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
                    <div className="fw-semibold text-dark d-flex align-items-center justify-content-center gap-1">
                      {role.label}
                      {BASE_ROLE_IDS.includes(role.id) && <i className="mdi mdi-lock-outline text-muted" title="Cargo base protegido" />}
                    </div>
                    {editMode && !BASE_ROLE_IDS.includes(role.id) ? (
                      <FormGroup switch className="mb-0 d-inline-flex align-items-center">
                        <Input
                          type="checkbox"
                          checked={selectedRoles.has(role.id)}
                          onChange={() => onSelectRole(role.id)}
                        />
                      </FormGroup>
                    ) : null}
                    {editMode && BASE_ROLE_IDS.includes(role.id) && (
                      <div className="small text-muted mt-1" style={{ fontSize: '10px' }}>Protegido</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                permissions.reduce((acc, p) => {
                  const cat = p.category || "GERAL"
                  if (!acc[cat]) acc[cat] = []
                  acc[cat].push(p)
                  return acc
                }, {})
              ).map(([category, catPermissions]) => (
                <React.Fragment key={category}>
                  <tr className="bg-light bg-opacity-50">
                    <td colSpan={roles.length + 1} className="py-2">
                      <span className="badge badge-soft-primary px-3 py-2 fs-6">
                        {category}
                      </span>
                    </td>
                  </tr>
                  {catPermissions.map(permission => (
                    <tr key={permission.id}>
                      <td className="ps-4">
                        <div className="fw-semibold">{permission.label}</div>
                        <div className="text-muted small">{permission.description}</div>
                      </td>
                      {roles.map(role => {
                        const isOwnerRole = role.id === "owner" || role.label?.toLowerCase() === "proprietário"
                        const checked = isOwnerRole ? true : Boolean(role.permissions?.[permission.id])
                        const inputId = `${role.id}-${permission.id}`
                        return (
                          <td key={inputId} className="text-center">
                            <FormGroup switch className="mb-0 d-inline-flex align-items-center">
                              <Input
                                type="switch"
                                id={inputId}
                                checked={checked}
                                disabled={editMode || isOwnerRole}
                                onChange={() => onTogglePermission(role.id, permission.id)}
                              />
                            </FormGroup>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}

export default PermissionsMatrix
