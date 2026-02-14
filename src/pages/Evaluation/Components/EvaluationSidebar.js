
import React from 'react';
import { Nav, NavItem, NavLink, Input } from 'reactstrap';
import classnames from 'classnames';
import ClassBar from '../../Grade/Components/ClassBar';

export const EvaluationSidebar = ({
    activeTab,
    setActiveTab,
    selectedStaffId,
    setSelectedStaffId,
    instructors,
    currentDate,
    handlePrevDay,
    handleNextDay,
    todaySchedules,
    selectedSchedule,
    setSelectedSchedule
}) => {
    return (
        <div className={selectedSchedule ? "d-none d-md-block" : ""}>
            <Nav pills className="mb-3 nav-justified bg-light p-1 rounded shadow-sm">
                <NavItem>
                    <NavLink
                        active={activeTab === "technical"}
                        onClick={() => setActiveTab("technical")}
                        style={{ cursor: "pointer" }}
                        className={classnames({ "bg-white text-primary shadow-sm": activeTab === "technical" })}
                    >
                        <i className="mdi mdi-medal-outline me-1"></i>
                        Avaliação
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        active={activeTab === "performance"}
                        onClick={() => setActiveTab("performance")}
                        style={{ cursor: "pointer" }}
                        className={classnames({ "bg-white text-primary shadow-sm": activeTab === "performance" })}
                    >
                        <i className="mdi mdi-timer-outline me-1"></i>
                        Testes
                    </NavLink>
                </NavItem>
            </Nav>

            <div className="mb-3">
                <Input
                    type="select"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="form-select border-0 shadow-sm"
                    style={{ backgroundColor: "#f8f9fa", fontWeight: "500" }}
                >
                    <option value="">Todos os Professores</option>
                    {instructors.map(inst => (
                        <option key={inst.id} value={inst.id}>
                            {inst.name || `${inst.firstName || ""} ${inst.lastName || ""}`.trim()}
                        </option>
                    ))}
                </Input>
            </div>
            <ClassBar
                date={currentDate}
                onPrevDay={handlePrevDay}
                onNextDay={handleNextDay}
                schedules={todaySchedules}
                emptyLabel="Nenhuma aula encontrada para este dia."
                onScheduleSelect={setSelectedSchedule}
                selectedId={selectedSchedule?.id}
            />
        </div>
    );
};
