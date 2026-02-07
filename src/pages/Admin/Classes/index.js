import React from "react"
import { connect } from "react-redux"
import { Card, CardBody, Container } from "reactstrap"

import ScheduleForm from "./Components/ScheduleForm/ScheduleForm"
import ClassesGradeCard from "./Components/ClassesGradeCard"
import { useClassesPage } from "./hooks/useClassesPage"
import { useGradeControls } from "./hooks/useGradeControls"
import PageLoader from "../../../components/Common/PageLoader"
import { setBreadcrumbItems } from "../../../store/actions"

import ConfirmDialog from "../../../components/Common/ConfirmDialog"
import OverlayLoader from "../../../components/Common/OverlayLoader"

const ClassesPage = ({ setBreadcrumbItems }) => {
  const grade = useGradeControls()

  const {
    formState,
    setFormState,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isLoading,
    isInitialLoading,
    isNavigationLoading,
    activities,
    areas,
    instructors,
    schedulesForGrid,
    handleClassClick,
    handleDeleteClick,
    handleConfirmDelete,

    handleSave,
  } = useClassesPage({
    setBreadcrumbItems,
    referenceDate: grade.referenceDate
  })

  // Breadcrumbs (Moved from hook to prevent loop)
  React.useEffect(() => {
    const breadcrumbItems = [
      { title: "Administrativo", link: "/admin" },
      { title: "Turmas", link: "/admin/classes" }
    ]
    setBreadcrumbItems("Gestão de Turmas", breadcrumbItems)
  }, []) // Empty dependency array checks ensures this runs only once on mount

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
        loading={isNavigationLoading}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        toggle={() => setShowDeleteConfirm(false)}
        title="Excluir Turma"
        description={<>
          <p><strong>Tem certeza que deseja excluir esta turma?</strong></p>
          <p className="text-warning small">
            <i className="mdi mdi-alert-outline me-1"></i>
            Esta ação irá excluir a turma e <strong>todas as sessões futuras</strong> a partir da data selecionada.
          </p>
          <p className="text-muted small mb-0">
            Sessões passadas serão mantidas para histórico.
          </p>
        </>}
        confirmText="Excluir Turma e Sessões"
        confirmColor="danger"
        onConfirm={handleConfirmDelete}
      />
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(ClassesPage)
