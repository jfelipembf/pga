import React, { useMemo } from "react"
import { Badge, Card, CardBody, CardHeader, Table, UncontrolledTooltip } from "reactstrap"
import { formatDate } from "../../../helpers/date"
import PropTypes from "prop-types"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import { ENROLLMENT_TYPES } from "../../../services/Enrollments/enrollment.types"
import {
  renderSchedule,
  renderActivity,
  renderInstructor,
  isCanceled
} from "../Utils/enrollmentUtils"

const ClientEnrollments = ({ client = null, enrollments = [], onEnroll = undefined, onRemove = undefined, removing = false, hasActiveContract = false, contractStatus = null }) => {
  const { active, past } = useMemo(() => {
    const activeItems = enrollments.filter(e => (e.status || "").toLowerCase() === "active")
    const pastItems = enrollments.filter(e => (e.status || "").toLowerCase() !== "active")
    return { active: activeItems, past: pastItems }
  }, [enrollments])

  const activeCount = Number(client?.enrollmentsActiveCount || 0)
  const pastCount = Number(client?.enrollmentsPastCount || 0)

  // Inline functions removed (weekdayLabel, renderSchedule, renderActivity, renderInstructor, isCanceled)

  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingRemove, setPendingRemove] = React.useState(null)

  const askRemove = item => {
    if (!onRemove) return
    setPendingRemove(item)
    setConfirmOpen(true)
  }

  const confirmRemove = () => {
    if (pendingRemove && onRemove) onRemove(pendingRemove)
    setConfirmOpen(false)
    setPendingRemove(null)
  }

  const cancelRemove = () => {
    setConfirmOpen(false)
    setPendingRemove(null)
  }

  const renderTypeBadge = (item) => {
    if (item.type === ENROLLMENT_TYPES.EXPERIMENTAL || item.type === 'single-session') {
      return (
        <>
          <Badge color="info" className="ms-1 cursor-pointer" id={`ae-${item.idEnrollment || item.id}`}>
            AE
          </Badge>
          <UncontrolledTooltip target={`ae-${item.idEnrollment || item.id}`} fade={false}>
            Aula Experimental
          </UncontrolledTooltip>
        </>
      )
    }
    return null
  }

  const isBlocked = ["suspended"].includes((contractStatus || "").toLowerCase())

  return (
    <Card className="shadow-sm">
      <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="mb-0">Matrículas</h5>
          <p className="text-muted mb-0 small">Turmas ativas e matrículas encerradas</p>
        </div>
        <div className="d-flex gap-2">
          <div className="d-inline-block" id="enrollButtonWrapper" tabIndex="0">
            <ButtonLoader
              color={hasActiveContract ? "primary" : "success"}
              size="sm"
              onClick={onEnroll}
              disabled={!onEnroll || isBlocked}
              loading={removing}
              style={isBlocked ? { opacity: 0.6, pointerEvents: "none" } : {}}
            >
              {hasActiveContract ? "Matricular" : "Agendar Aula Experimental"}
            </ButtonLoader>
          </div>
          {isBlocked && (
            <UncontrolledTooltip target="enrollButtonWrapper" fade={false}>
              Clone com contrato suspenso. Regularize para matricular.
            </UncontrolledTooltip>
          )}
        </div>
      </CardHeader>
      <CardBody className="d-grid gap-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <h6 className="mb-0">Ativas</h6>
            <Badge color="success" pill>{activeCount}</Badge>
          </div>
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Horário</th>
                  <th>Professor</th>
                  <th>Início</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {active.map(item => (
                  <tr key={item.idEnrollment || item.id}>
                    <td>
                      {renderActivity(item)}
                      {renderTypeBadge(item)}
                    </td>
                    <td>{renderSchedule(item)}</td>
                    <td>{renderInstructor(item)}</td>
                    <td>{formatDate(item.start || item.startDate)}</td>
                    <td className="text-end" style={{ width: 90 }}>
                      <ButtonLoader
                        color="link"
                        className="px-2 text-danger"
                        onClick={() => askRemove(item)}
                        loading={removing}
                        size="sm"
                      >
                        Remover
                      </ButtonLoader>
                    </td>
                  </tr>
                ))}
                {active.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-3">
                      Nenhuma matrícula ativa.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>

        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <h6 className="mb-0">Encerradas / Canceladas</h6>
            <Badge color="secondary" pill>{pastCount}</Badge>
          </div>
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Horário</th>
                  <th>Professor</th>
                  <th>Início</th>
                  <th>Encerramento</th>
                </tr>
              </thead>
              <tbody>
                {past.map(item => (
                  <tr key={item.idEnrollment || item.id}>
                    <td className={isCanceled(item) ? "text-muted" : ""}>
                      {renderActivity(item)}
                      {renderTypeBadge(item)}
                    </td>
                    <td className={isCanceled(item) ? "text-muted" : ""}>{renderSchedule(item)}</td>
                    <td className={isCanceled(item) ? "text-muted" : ""}>{renderInstructor(item)}</td>
                    <td className={isCanceled(item) ? "text-muted" : ""}>{formatDate(item.start || item.startDate)}</td>
                    <td className={isCanceled(item) ? "text-muted" : ""}>
                      {isCanceled(item) ? formatDate(item.canceledAt) : formatDate(item.end || item.endDate)}
                    </td>
                  </tr>
                ))}
                {past.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-3">
                      Nenhuma matrícula anterior.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </CardBody>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Remover matrícula"
        message="Tem certeza que deseja remover esta matrícula? A ocupação da turma será ajustada para as próximas sessões."
        confirmText="Remover"
        confirmColor="danger"
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
      />
    </Card>
  )
}

export default ClientEnrollments

ClientEnrollments.propTypes = {
  client: PropTypes.object,
  enrollments: PropTypes.array,
  onEnroll: PropTypes.func,
  onRemove: PropTypes.func,
  hasActiveContract: PropTypes.bool,
  contractStatus: PropTypes.string,
}
