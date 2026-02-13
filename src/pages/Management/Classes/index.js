import React from "react"
import { connect } from "react-redux"
import { Card, CardBody, Container } from "reactstrap"

import ScheduleForm from "./Components/ScheduleForm/ScheduleForm"
import ClassesGradeCard from "./Components/ClassesGradeCard"
import { useClassesPage } from "./hooks/useClassesPage"
import { useGradeControls } from "./hooks/useGradeControls"
// PageLoader removed
import { setBreadcrumbItems } from "../../../store/actions"

import PageLoader from "../../../components/Common/PageLoader"
import { useTenant } from "../../../hooks/useTenant"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"
import OverlayLoader from "../../../components/Common/OverlayLoader"

const ClassesPage = ({ setBreadcrumbItems }) => {
  const { isReady } = useTenant()
  const grade = useGradeControls()

  const {
    formState,
    setFormState,
    errors,
    touched,
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
      { title: "Gerencial", link: "#" },
      { title: "Turmas", link: "/admin/classes" }
    ]
    setBreadcrumbItems("Gestão de Turmas", breadcrumbItems)
  }, [setBreadcrumbItems])

  if (!isReady || isInitialLoading) {
    return <PageLoader isFullScreen={true} />
  }

  return (
    <Container fluid className="classes-page">
      <Card className="shadow-sm position-relative">
        <OverlayLoader show={isLoading("save") || isLoading("delete")} label="Processando..." />
        <CardBody>

          <ScheduleForm
            values={formState}
            errors={errors}
            touched={touched}
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
