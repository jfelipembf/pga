import React from "react"
import { connect } from "react-redux"
import { Card, CardBody, Container } from "reactstrap"

import { ScheduleForm, ClassesGradeCard } from "./Components"
import PageLoader from "../../../components/Common/PageLoader"

import { setBreadcrumbItems } from "../../../store/actions"

import { useClassesPage, useGradeControls } from "./Hooks"

import ConfirmDialog from "components/Common/ConfirmDialog"
import OverlayLoader from "components/Common/OverlayLoader"

const ClassesPage = ({ setBreadcrumbItems }) => {
  const {
    formState,
    setFormState,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isLoading,
    isInitialLoading,
    activities,
    areas,
    instructors,
    schedulesForGrid,
    handleClassClick,
    handleDeleteClick,
    handleConfirmDelete,
    handleSave,
  } = useClassesPage({ setBreadcrumbItems })

  const grade = useGradeControls()

  if (isInitialLoading) {
    return <PageLoader />
  }

  return (
    <Container fluid className="classes-page">
      <Card className="shadow-sm position-relative">
        <OverlayLoader show={isLoading("save") || isLoading("delete")} />
        <CardBody>
          <ScheduleForm
            values={formState}
            errors={{}}
            touched={{}}
            handleChange={(e) => {
              const { name, value } = e.target
              setFormState((prev) => ({ ...prev, [name]: value }))
            }}
            setFieldValue={(field, value) =>
              setFormState((prev) => ({ ...prev, [field]: value }))
            }
            activities={activities}
            instructors={instructors}
            areas={areas}
            disabled={isLoading("save") || isLoading("delete")}
            onSave={handleSave}
            onDelete={formState.id ? handleDeleteClick : undefined}
            saving={isLoading("save")}
          />
        </CardBody>
      </Card>

      <ClassesGradeCard
        turn={grade.turn}
        onTurnChange={grade.setTurn}
        view={grade.view}
        onViewChange={grade.setView}
        referenceDate={grade.referenceDate}
        onReferenceDateChange={grade.setReferenceDate}
        showOccupancy={grade.showOccupancy}
        onShowOccupancyChange={grade.setShowOccupancy}
        schedules={schedulesForGrid}
        onClassClick={handleClassClick}
        selectedClassId={formState.id}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Excluir Turma"
        message={<>
          <p>Tem certeza que deseja excluir esta turma?</p>
          <p className="text-muted small mb-0">Essa ação pode ser irreversível se não houver histórico.</p>
        </>}
        confirmText="Excluir"
        confirmColor="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(ClassesPage)
