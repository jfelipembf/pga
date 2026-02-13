import React, { useEffect } from "react"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../../store/actions"
import ManagementLayout from "../../../components/Common/ManagementLayout"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import { useEvents } from "./hooks/useEvents"
import { useEventForm } from "./hooks/useEventForm"
import { EventForm, EventListItem } from "./Components"
import { useTenant } from "../../../hooks/useTenant"

import PageLoader from "../../../components/Common/PageLoader"
import OverlayLoader from "../../../components/Common/OverlayLoader"
import RankingModal from "./Ranking/RankingModal"

const EventsPage = ({ setBreadcrumbItems }) => {
    document.title = "Ciclos de Avaliação e Testes | PGA Admin"
    const { user, isReady } = useTenant()

    // Ranking State
    const [rankingOpen, setRankingOpen] = React.useState(false)
    const [rankingEvent, setRankingEvent] = React.useState(null)

    const {
        events,
        loading,
        saving,
        handleSave
    } = useEvents()

    const {
        selectedId,
        isAddingNew,
        formData,
        setFormData,
        handleAddClick,
        handleEventClick,
        handleCancel
    } = useEventForm()

    const openRanking = (event) => {
        setRankingEvent(event)
        setRankingOpen(true)
    }

    // Breadcrumbs - stable reference
    useEffect(() => {
        setBreadcrumbItems("Ciclos de Avaliação e Testes", [
            { title: "Gerencial", link: "#" },
            { title: "Ciclos de Avaliação", link: "/admin/events" },
        ])
    }, [setBreadcrumbItems])

    const SidebarContent = (
        <div className="position-relative" style={{ minHeight: '300px' }}>
            {loading && events.length === 0 ? (
                <PageLoader isFullScreen={false} />
            ) : events.length === 0 ? (
                <div className="p-4 text-center text-muted small">
                    Nenhum ciclo cadastrado.
                </div>
            ) : (
                events.map(event => (
                    <EventListItem
                        key={event.id}
                        event={event}
                        isSelected={selectedId === event.id}
                        onClick={() => handleEventClick(event)}
                    />
                ))
            )}
        </div>
    )

    const MainContent = (
        <div className="position-relative" style={{ minHeight: '400px' }}>
            <OverlayLoader show={saving} label="Salvando ciclo..." />

            {loading && !events.length ? (
                <PageLoader isFullScreen={false} />
            ) : (selectedId || isAddingNew) ? (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0">
                            {isAddingNew ? 'Cadastrar Novo Ciclo' : 'Detalhes do Ciclo'}
                        </h5>
                        <div className="d-flex gap-2">
                            {selectedId && formData.type === 'test' && (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => openRanking(formData)}
                                >
                                    <i className="mdi mdi-format-list-numbered me-1"></i>
                                    Ranking / Resultados
                                </button>
                            )}
                            <button className="btn btn-secondary btn-sm" onClick={handleCancel}>
                                Cancelar
                            </button>
                            <ButtonLoader
                                loading={saving}
                                color="primary"
                                size="sm"
                                onClick={async () => {
                                    const ok = await handleSave(user, formData)
                                    if (ok) handleCancel()
                                }}
                            >
                                Salvar
                            </ButtonLoader>
                        </div>
                    </div>

                    <div className="card border shadow-none">
                        <div className="card-body">
                            <EventForm
                                value={formData}
                                onChange={setFormData}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                    <i className="mdi mdi-calendar-check mb-3" style={{ fontSize: '5rem', opacity: 0.1 }}></i>
                    <h5 className="fw-bold">Gestão de Ciclos</h5>
                    <p className="text-center px-4" style={{ maxWidth: '300px' }}>
                        Selecione um período de avaliação ou teste ao lado para visualizar os detalhes ou crie um novo agora.
                    </p>
                    <button className="btn btn-primary btn-sm mt-3 px-4 shadow" onClick={handleAddClick}>
                        Novo Ciclo
                    </button>
                </div>
            )}
        </div>
    )

    return (
        <React.Fragment>
            <ManagementLayout
                sidebarTitle="Ciclos Registrados"
                sidebarContent={SidebarContent}
                mainContent={MainContent}
                onAddClick={handleAddClick}
                addLabel="Novo Ciclo"
                isLoading={loading && !isReady}
            />

            <RankingModal
                isOpen={rankingOpen}
                toggle={() => setRankingOpen(!rankingOpen)}
                event={rankingEvent}
            />
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(EventsPage)
