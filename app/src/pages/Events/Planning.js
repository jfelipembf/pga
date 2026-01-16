import React, { useEffect } from "react"
import { Card, CardBody, CardHeader, Col, Container, Form, FormGroup, Input, Label, Row } from "reactstrap"
import { connect } from "react-redux"
import { formatDate } from "../../helpers/date"

import { setBreadcrumbItems } from "../../store/actions"
import SideMenu from "components/Common/SideMenu"
import ButtonLoader from "../../components/Common/ButtonLoader"
import PageLoader from "../../components/Common/PageLoader"
import ConfirmDialog from "../../components/Common/ConfirmDialog"

import { usePlanningEvents } from "./Hooks/usePlanningEvents"
import { PLANNING_TABS, TEST_TYPES } from "./Constants/planningDefaults"
import PhotoPreview from "components/Common/PhotoPreview"
import { PLACEHOLDER_CAMERA } from "../Clients/Constants/defaults"

const PlanningEventsPage = ({ setBreadcrumbItems }) => {
  const {
    activeEventId,
    setActiveEventId,
    tab,
    setTab,
    testType,
    setTestType,
    form,
    setForm,
    updateField,
    events,
    isDeleteModalOpen,
    handleNew,
    handleSave,
    handleDelete,
    confirmDelete,
    cancelDelete,
    isLoading,
    uploading
  } = usePlanningEvents()

  const handlePhotoChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      // Update form state directly since hook exposes setForm
      // Actually hook exposes updateField, but that's for simple fields. 
      // setForm is exposed.
      setForm(prev => ({
        ...prev,
        photo: reader.result,
        photoFile: file
      }))
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    const breadcrumbs = [
      { title: "Eventos", link: "/events" },
      { title: "Planejamento", link: "/events/planning" },
    ]
    setBreadcrumbItems("Planejamento de eventos", breadcrumbs)
  }, [setBreadcrumbItems])

  const renderTestSpecificFields = () => {
    const isTempo = testType === TEST_TYPES.TEMPO
    return (
      <>
        <Col md="4">
          <FormGroup>
            <Label>Tipo de teste</Label>
            <Input type="select" value={testType} onChange={e => setTestType(e.target.value)}>
              <option value="tempo">Por tempo</option>
              <option value="distancia">Por distância</option>
            </Input>
          </FormGroup>
        </Col>
        <Col md="4">
          <FormGroup>
            <Label>{isTempo ? "Distância (m)" : "Tempo alvo"}</Label>
            <Input
              value={isTempo ? form.distance : form.time}
              onChange={e => updateField(isTempo ? "distance" : "time", e.target.value)}
              placeholder={isTempo ? "Ex.: 1000" : "Ex.: 00:04:30"}
            />
          </FormGroup>
        </Col>
        <Col md="4">
          <FormGroup>
            <Label>Estilos</Label>
            <Input
              value={form.styles}
              onChange={e => updateField("styles", e.target.value)}
              placeholder="Ex.: Crawl, Costas"
            />
          </FormGroup>
        </Col>
      </>
    )
  }

  if (isLoading('page') && !events.length) {
    return <PageLoader />
  }

  return (
    <Container fluid className="event-planning">
      <Row className="g-4">
        <Col lg="4">
          <SideMenu
            title="Eventos"
            description="Selecione um evento para editar."
            items={(events || []).map(ev => ({
              id: ev.id,
              title: ev.title,
              subtitle:
                ev.startDate && ev.endDate
                  ? `${formatDate(ev.startDate)} - ${formatDate(ev.endDate)}`
                  : ev.startDate ? formatDate(ev.startDate) : "Sem data",
              meta: ev.status || "planejado",
              helper: ev.type === "teste" ? "Teste" : ev.type === "outro" ? "Outro" : "Avaliação",
            }))}
            selectedId={activeEventId}
            onSelect={setActiveEventId}
            emptyLabel="Nenhum evento encontrado."
            onDelete={handleDelete}
            onEdit={id => setActiveEventId(id)}
            headerActions={
              <ButtonLoader color="primary" size="sm" onClick={handleNew} loading={isLoading('save')}>
                <i className="mdi mdi-plus" /> Novo
              </ButtonLoader>
            }
          />
        </Col>

        <Col lg="8">
          <Card className="shadow-sm h-100">
            <CardHeader className="bg-white">
              <div className="client-contracts__tabs">
                {[PLANNING_TABS.AVALIACAO, PLANNING_TABS.TESTES, PLANNING_TABS.OUTRO].map(key => (
                  <button
                    key={key}
                    type="button"
                    className={`client-profile__tab ${tab === key ? "client-profile__tab--active" : ""}`}
                    onClick={() => setTab(key)}
                  >
                    {key === PLANNING_TABS.AVALIACAO ? "Avaliação" : key === PLANNING_TABS.TESTES ? "Testes" : "Outro"}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardBody>
              <Form>
                <Row className="g-3">
                  {tab === PLANNING_TABS.OUTRO && (
                    <Col md="12" className="d-flex justify-content-center mb-3">
                      <PhotoPreview
                        inputId="eventPhoto"
                        preview={form.photo}
                        placeholder={PLACEHOLDER_CAMERA}
                        onChange={handlePhotoChange}
                        size={120}
                      />
                    </Col>
                  )}
                  <Col md="6">
                    <FormGroup>
                      <Label>Nome</Label>
                      <Input value={form.name} onChange={e => updateField("name", e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label>Descrição</Label>
                      <Input value={form.description} onChange={e => updateField("description", e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>Data início</Label>
                      <Input type="date" value={form.startDate} onChange={e => updateField("startDate", e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>Data fim</Label>
                      <Input type="date" value={form.endDate} onChange={e => updateField("endDate", e.target.value)} />
                    </FormGroup>
                  </Col>
                  {tab === PLANNING_TABS.TESTES && renderTestSpecificFields()}
                </Row>

                <div className="d-flex justify-content-end mt-3">
                  <ButtonLoader color="primary" onClick={handleSave} loading={isLoading('save') || uploading}>
                    Salvar
                  </ButtonLoader>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>


      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Excluir Evento"
        message="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmColor="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(PlanningEventsPage)
