import React, { useState } from 'react';
import { Card, CardBody, Container } from 'reactstrap';
import GradeGrid from '../../Grade/Components/GradeGrid'; // Reusing GradeGrid
import GradeHeader from '../../Grade/Components/GradeHeader'; // Reusing GradeHeader
import PlanningSessionModal from './components/PlanningSessionModal'; // The new modal
import { useGradeData } from '../../Grade/Hooks/useGradeData'; // Reusing Grade Data (sessions, staff, etc)
import { usePlanningData } from './hooks/usePlanningData'; // Reusing Planning Data (students for a session)
import { getStartOfWeek } from '../../../utils/date';

const Planning = () => {
    const [view, setView] = useState("week");
    const [referenceDate, setReferenceDate] = useState(new Date());
    const [turn, setTurn] = useState("all");
    const [showOccupancy, setShowOccupancy] = useState(true);

    // Reusing Grade Data
    const { sessions, loading: loadingData, staff, activities, areas } = useGradeData(referenceDate);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const { students, loadingStudents, loadSessionStudents } = usePlanningData();

    // Derived Week Start for Objectives
    const weekStart = getStartOfWeek(referenceDate);

    // Grid Interaction
    const handleSelectSchedule = (schedule) => {
        setSelectedSession(schedule);
        setModalOpen(true);
        loadSessionStudents(schedule); // Fetch students for this session
    };

    // Prepare Schedules for Grid (enriching with names/colors similar to Grade/index.js)
    const schedules = sessions.map(session => {
        const activity = (activities || []).find(a => String(a.id) === String(session.idActivity)) || {};
        const area = (areas || []).find(a => String(a.id) === String(session.idArea)) || {};
        const instructor = (staff || []).find(i => String(i.id) === String(session.idStaff)) || {};

        return {
            ...session,
            activityName: activity.name || 'Atividade',
            activityColor: activity.color || activity.colorHex || '#4CAF50',
            areaName: area.name || '',
            areaColor: area.color || area.colorHex || '#2196F3',
            instructorName: instructor.name || '',
            // Ensure fields for grid
            capacity: session.capacity || session.maxCapacity || 20,
            enrolledCount: session.enrolledCount || 0,
            isActive: session.isActive !== false,
        };
    });

    return (
        <div className="page-content">
            <Container fluid>
                {/* 1. Header & Controls */}
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

                {/* 2. The Grid */}
                <Card>
                    <CardBody>
                        <GradeGrid
                            turn={turn}
                            view={view}
                            referenceDate={referenceDate}
                            weekStart={weekStart}
                            schedules={schedules}
                            showOccupancy={showOccupancy}
                            loading={loadingData}
                            onSelectSchedule={handleSelectSchedule}
                            selectedScheduleId={selectedSession?.id}
                        />
                    </CardBody>
                </Card>

                {/* 3. The Modal */}
                <PlanningSessionModal
                    isOpen={modalOpen}
                    toggle={() => setModalOpen(!modalOpen)}
                    session={selectedSession}
                    students={students}
                    loading={loadingStudents}
                />

            </Container>
        </div>
    );
};

export default Planning;
