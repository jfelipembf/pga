import React, { useState } from 'react';
import { Card, CardBody } from 'reactstrap';
import GradeGrid from '../../Grade/Components/GradeGrid'; // Reusing GradeGrid
import GradeHeader from '../../Grade/Components/GradeHeader'; // Reusing GradeHeader
import PlanningSessionModal from './components/PlanningSessionModal'; // The new modal
import { usePlanningData } from './hooks/usePlanningData';
import { useGrade } from '../../../contexts/GradeContext';

/**
 * Página de Planejamento de Metodologia.
 * Consome o GradeContext para manter a grade sincronizada com a operacional e permitir navegação fluida.
 */
const Planning = () => {
    // 1. Estados Compartilhados via GradeContext
    const {
        sessions,
        loading: loadingData,
        referenceDate,
        setReferenceDate,
        view,
        setView,
        turn,
        setTurn,
        showOccupancy,
        setShowOccupancy,
        weekStart
    } = useGrade();

    // 2. Estados Locais do Planejamento
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const { clients, loadingclients, loadSessionclients } = usePlanningData();

    // Interaction
    const handleSelectSchedule = (schedule) => {
        setSelectedSession(schedule);
        setModalOpen(true);
        loadSessionclients(schedule); // Fetch clients for this session
    };

    return (
        <React.Fragment>
            {/* 1. Header & Controls */}
            <Card className="mb-4">
                <CardBody className="pb-2">
                    <GradeHeader
                        turn={turn}
                        onTurnChange={setTurn}
                        view={view}
                        onViewChange={setView}
                        referenceDate={referenceDate}
                        onReferenceDateChange={setReferenceDate}
                        showOccupancy={showOccupancy}
                        onShowOccupancyChange={setShowOccupancy}
                    />
                </CardBody>
            </Card>

            {/* 2. The Grid */}
            <Card>
                <CardBody>
                    <GradeGrid
                        turn={turn}
                        view={view}
                        referenceDate={referenceDate}
                        weekStart={weekStart}
                        schedules={sessions}
                        showOccupancy={showOccupancy}
                        loading={loadingData}
                        onSelectSchedule={handleSelectSchedule}
                        selectedScheduleId={selectedSession?.id}
                    />
                </CardBody>
            </Card>

            {/* 3. The Modal (Análise de Avaliações e Planejamento) */}
            <PlanningSessionModal
                key={selectedSession?.id || "planning-modal"}
                isOpen={modalOpen}
                toggle={() => setModalOpen(!modalOpen)}
                session={selectedSession}
                clients={clients}
                loading={loadingclients}
            />
        </React.Fragment>
    );
};

export default Planning;
