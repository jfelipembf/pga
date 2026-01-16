import React from "react"
import { Badge, Card, CardBody, CardHeader } from "reactstrap"

const CollaboratorClasses = ({ classes = [] }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <h5 className="mb-0">Minhas turmas</h5>
      </CardHeader>
      <CardBody className="p-0">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Turma</th>
                <th>Horário</th>
                <th>Alunos</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(item => (
                <tr key={item.id}>
                  <td className="fw-semibold">{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.schedule}</td>
                  <td>{item.clients}</td>
                  <td>
                    <Badge color={item.status === "Ativa" ? "success" : "warning"} pill>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-3">
                    Nenhuma turma atribuída.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}

export default CollaboratorClasses
