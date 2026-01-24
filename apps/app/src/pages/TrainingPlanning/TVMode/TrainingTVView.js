import React, { useState, useEffect, useCallback, forwardRef } from "react";
import { Badge, Button } from "reactstrap";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { listTrainingPlans } from "../../../services/TrainingPlanning/trainingPlanning.service";
import { formatDateKey } from "../utils/trainingUtils";
import { formatDateDisplay } from "../../../utils/date";
import PageLoader from "../../../components/Common/PageLoader";
import logoTV from "../../../assets/images/logoTV.png";

// Custom Input for DatePicker (Icon) - Moved outside to prevent re-creation
const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <Button
        color="light"
        className="btn-lg rounded-circle shadow-sm d-flex align-items-center justify-content-center"
        style={{ width: '60px', height: '60px' }}
        onClick={onClick}
        ref={ref}
    >
        <i className="mdi mdi-calendar-month text-primary" style={{ fontSize: '32px' }}></i>
    </Button>
));

const TrainingTVView = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadWorkouts = useCallback(async () => {
        if (!selectedDate) {
            setWorkouts([]);
            return;
        }

        const dateStr = formatDateKey(selectedDate);

        try {
            setLoading(true);
            const data = await listTrainingPlans(dateStr);
            setWorkouts(data);
        } catch (error) {
            console.error("Error loading TV workouts:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadWorkouts();
    }, [loadWorkouts]);

    return (
        <div className="min-vh-100 bg-light d-flex flex-column" style={{ overflowX: "hidden" }}>

            {/* Header Bar */}
            <div className="bg-white shadow-sm sticky-top position-relative" style={{ zIndex: 100, height: '80px' }}>
                {/* Left: Logo (Absolute) */}
                <div style={{ position: 'absolute', left: '10px', top: '-25px', zIndex: 101 }}>
                    <img src={logoTV} alt="Logo" height="150" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))' }} />
                </div>

                {/* Center: Current Date Title (Centered) */}
                <div className="d-flex flex-column align-items-center justify-content-center h-100 w-100">
                    <h2 className="mb-0 text-primary fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '1.8rem' }}>
                        {formatDateDisplay(selectedDate, { weekday: 'long' })}
                    </h2>
                    <span className="text-muted fs-5">
                        {formatDateDisplay(selectedDate, { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                </div>

                {/* Right: DatePicker (Absolute) */}
                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 101 }}>
                    <ReactDatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        customInput={<CustomDateInput />}
                        popperPlacement="bottom-end"
                        locale="pt-BR"
                    />
                </div>
            </div>

            {/* Main Content: Workouts */}
            <div className="flex-grow-1 p-5 container-fluid">
                {loading ? (
                    <PageLoader />
                ) : workouts.length === 0 ? (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-50" style={{ minHeight: '60vh' }}>
                        <i className="mdi mdi-swim text-primary font-size-100 mb-4 opacity-25"></i>
                        <h1 className="fw-light text-muted display-4">Dia de Descanso?</h1>
                        <p className="fs-3">Nenhum treino encontrado para esta data.</p>
                    </div>
                ) : (
                    <div className="container-fluid px-5">
                        {workouts.map((workout, workoutIndex) => (
                            <div key={workout.id || workoutIndex} className="mb-5 animate-fade-in">
                                {/* Workout Header - Clean and Minimal */}
                                <div className="d-flex align-items-baseline gap-3 mb-4 pb-3 border-bottom border-3 border-primary">
                                    <h1 className="fw-bold mb-0 text-primary" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
                                        {workout.totalDistance}m
                                    </h1>
                                    {workout.description && (
                                        <span className="text-muted" style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>{workout.description}</span>
                                    )}
                                </div>

                                {/* Render Sections or Legacy Items */}
                                {workout.sections && workout.sections.length > 0 ? (
                                    // NEW: Section-based rendering
                                    workout.sections.map((section, sectionIdx) => {
                                        const sectionDistance = section.items.reduce((acc, item) => {
                                            const reps = parseInt(item.reps) || 0;
                                            const distance = parseInt(item.distance) || 0;
                                            return acc + (reps * distance);
                                        }, 0);

                                        return (
                                            <div key={section.id || sectionIdx} className="mb-4">
                                                {/* Section Header */}
                                                <div className="d-flex align-items-center gap-3 mb-3 pb-2 border-bottom border-2">
                                                    <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 2rem)' }}>
                                                        {section.name}
                                                    </h2>
                                                    <Badge color="primary" className="px-3 py-1" style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)' }}>
                                                        {sectionDistance}m
                                                    </Badge>
                                                </div>

                                                {/* Table Header */}
                                                <div className="tv-table-header d-flex align-items-center py-2 px-3 bg-light rounded-top border-bottom border-2 border-primary">
                                                    <div style={{ width: '40px', fontSize: 'clamp(0.6rem, 1vw, 0.75rem)' }} className="text-center fw-bold text-uppercase text-muted">#</div>
                                                    <div style={{ width: '80px', fontSize: 'clamp(0.6rem, 1vw, 0.75rem)' }} className="text-center fw-bold text-uppercase text-muted">Séries</div>
                                                    <div style={{ width: '100px', fontSize: 'clamp(0.6rem, 1vw, 0.75rem)' }} className="text-center fw-bold text-uppercase text-muted">Distância</div>
                                                    <div style={{ flex: '1 1 150px', fontSize: 'clamp(0.6rem, 1vw, 0.75rem)' }} className="fw-bold text-uppercase text-muted">Exercício</div>
                                                    <div style={{ flex: '1 1 150px', fontSize: 'clamp(0.6rem, 1vw, 0.75rem)' }} className="fw-bold text-uppercase text-muted">Estilo</div>
                                                    <div style={{ flex: '1 1 150px', fontSize: 'clamp(0.6rem, 1vw, 0.75rem)' }} className="fw-bold text-uppercase text-muted">Material</div>
                                                    <div style={{ flex: '1 1 120px', fontSize: 'clamp(0.6rem, 1vw, 0.75rem)' }} className="fw-bold text-uppercase text-muted">Intensidade</div>
                                                    <div style={{ flex: '1 1 100px', fontSize: 'clamp(0.6rem, 1vw, 0.75rem)' }} className="fw-bold text-uppercase text-muted">Int. (s)</div>
                                                    <div style={{ flex: '2 1 200px', fontSize: 'clamp(0.6rem, 1vw, 0.75rem)' }} className="fw-bold text-uppercase text-muted">Observação</div>
                                                </div>

                                                {/* Table Rows */}
                                                <div className="bg-white rounded-bottom shadow-sm mb-4">
                                                    {section.items?.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="tv-table-row d-flex align-items-center py-2 px-3 border-bottom"
                                                            style={{
                                                                transition: 'background-color 0.2s',
                                                                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa'
                                                            }}
                                                        >
                                                            {/* Item Number */}
                                                            <div style={{ width: '40px' }} className="text-center">
                                                                <span className="fw-bold text-muted" style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)' }}>
                                                                    {idx + 1}
                                                                </span>
                                                            </div>

                                                            {/* Reps */}
                                                            <div style={{ width: '80px' }} className="text-center">
                                                                <span className="fw-bold text-primary" style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>
                                                                    {item.reps}x
                                                                </span>
                                                            </div>

                                                            {/* Distance */}
                                                            <div style={{ width: '100px' }} className="text-center">
                                                                <span className="fw-semibold text-dark" style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.3rem)' }}>
                                                                    {item.distance}m
                                                                </span>
                                                            </div>

                                                            {/* Exercise */}
                                                            <div style={{ flex: '1 1 150px' }}>
                                                                <span className="text-dark" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1.1rem)' }}>
                                                                    {item.exercise || '-'}
                                                                </span>
                                                            </div>

                                                            {/* Style */}
                                                            <div style={{ flex: '1 1 150px' }}>
                                                                <span className="fw-semibold text-dark" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1.1rem)' }}>
                                                                    {item.style?.label || '-'}
                                                                </span>
                                                            </div>

                                                            {/* Equipment/Material */}
                                                            <div style={{ flex: '1 1 150px' }}>
                                                                {item.equipment && item.equipment.length > 0 ? (
                                                                    <div className="d-flex flex-wrap gap-1">
                                                                        {item.equipment.map((eq, eqIdx) => (
                                                                            <Badge key={eqIdx} color="secondary" className="px-2 py-1" style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.85rem)' }}>
                                                                                {eq.label || eq.value || eq}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </div>

                                                            {/* Intensity */}
                                                            <div style={{ flex: '1 1 120px' }}>
                                                                {item.intensity ? (
                                                                    <Badge color="info" className="px-2 py-1" style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.85rem)' }}>
                                                                        {item.intensity.label || item.intensity.value || item.intensity}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </div>

                                                            {/* Interval */}
                                                            <div style={{ flex: '1 1 100px' }}>
                                                                {item.interval ? (
                                                                    <div className="d-flex align-items-center text-primary">
                                                                        <span className="fw-semibold" style={{ fontSize: 'clamp(0.75rem, 1.3vw, 0.95rem)' }}>{item.interval}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </div>

                                                            {/* Observation */}
                                                            <div style={{ flex: '2 1 200px' }}>
                                                                {item.observation ? (
                                                                    <span className="text-muted fst-italic" style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)' }}>
                                                                        {item.observation}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    // LEGACY: Flat items rendering (for backwards compatibility)
                                    <>
                                        {/* Table Header */}
                                        <div className="tv-table-header d-flex align-items-center py-3 px-4 bg-light rounded-top border-bottom border-2 border-primary">
                                            <div style={{ width: '60px' }} className="text-center fw-bold text-uppercase small text-muted">#</div>
                                            <div style={{ width: '100px' }} className="text-center fw-bold text-uppercase small text-muted">Séries</div>
                                            <div style={{ width: '120px' }} className="text-center fw-bold text-uppercase small text-muted">Distância</div>
                                            <div style={{ flex: '1 1 200px' }} className="fw-bold text-uppercase small text-muted">Estilo</div>
                                            <div style={{ flex: '1 1 200px' }} className="fw-bold text-uppercase small text-muted">Material</div>
                                            <div style={{ flex: '1 1 180px' }} className="fw-bold text-uppercase small text-muted">Intensidade</div>
                                            <div style={{ flex: '1 1 150px' }} className="fw-bold text-uppercase small text-muted">Intervalo</div>
                                            <div style={{ flex: '2 1 300px' }} className="fw-bold text-uppercase small text-muted">Observação</div>
                                        </div>

                                        {/* Table Rows */}
                                        <div className="bg-white rounded-bottom shadow-sm">
                                            {workout.items?.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="tv-table-row d-flex align-items-center py-4 px-4 border-bottom"
                                                    style={{
                                                        transition: 'background-color 0.2s',
                                                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa'
                                                    }}
                                                >
                                                    {/* Same item rendering as above */}
                                                    <div style={{ width: '60px' }} className="text-center">
                                                        <span className="fw-bold text-muted" style={{ fontSize: '1.5rem' }}>
                                                            {idx + 1}
                                                        </span>
                                                    </div>
                                                    <div style={{ width: '100px' }} className="text-center">
                                                        <span className="fw-bold text-primary" style={{ fontSize: '1.8rem' }}>
                                                            {item.reps}x
                                                        </span>
                                                    </div>
                                                    <div style={{ width: '120px' }} className="text-center">
                                                        <span className="fw-semibold text-dark" style={{ fontSize: '1.5rem' }}>
                                                            {item.distance}m
                                                        </span>
                                                    </div>
                                                    <div style={{ flex: '1 1 200px' }}>
                                                        <span className="fw-semibold text-dark" style={{ fontSize: '1.3rem' }}>
                                                            {item.style?.label || '-'}
                                                        </span>
                                                    </div>
                                                    <div style={{ flex: '1 1 200px' }}>
                                                        {item.equipment && item.equipment.length > 0 ? (
                                                            <div className="d-flex flex-wrap gap-1">
                                                                {item.equipment.map((eq, eqIdx) => (
                                                                    <Badge key={eqIdx} color="secondary" className="fs-6 px-2 py-1">
                                                                        {eq.label || eq.value || eq}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </div>
                                                    <div style={{ flex: '1 1 180px' }}>
                                                        {item.intensity ? (
                                                            <Badge color="info" className="fs-6 px-3 py-2">
                                                                {item.intensity.label || item.intensity.value || item.intensity}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </div>
                                                    <div style={{ flex: '1 1 150px' }}>
                                                        {item.interval ? (
                                                            <div className="d-flex align-items-center text-primary">
                                                                <i className="mdi mdi-timer-outline me-2" style={{ fontSize: '1.2rem' }}></i>
                                                                <span className="fw-semibold">{item.interval}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </div>
                                                    <div style={{ flex: '2 1 300px' }}>
                                                        {item.observation ? (
                                                            <span className="text-muted fst-italic" style={{ fontSize: '0.95rem' }}>
                                                                {item.observation}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>
                {`
                    .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    
                    /* DatePicker Popper Customization */
                    .react-datepicker-popper { z-index: 1050 !important; }
                    .react-datepicker { font-size: 1.1rem; border: none; box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15); }
                    .react-datepicker__header { background-color: #fff; border-bottom: 1px solid #eee; }
                    .react-datepicker__day-name { width: 2.5rem; line-height: 2.5rem; }
                    .react-datepicker__day { width: 2.5rem; line-height: 2.5rem; }
                    .react-datepicker__day--selected { background-color: #556ee6 !important; }
                    
                    /* Table hover effect */
                    .tv-table-row:hover {
                        background-color: #e9ecef !important;
                    }
                `}
            </style>
        </div>
    );
};

export default TrainingTVView;
