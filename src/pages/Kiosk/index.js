
import React from 'react';
import { Container } from 'reactstrap';
import StudentSearch from './components/StudentSearch';
import VirtualKeyboard from './components/VirtualKeyboard';
import EvaluationResults from './components/EvaluationResults';

import { useKioskController } from './hooks/useKioskController';
import logoIcon from "../../assets/images/logoIcon.png"

/**
 * Kiosk Main Page
 * Optimized for touch devices, vertical layout, dark theme by default or high contrast.
 */
const Kiosk = () => {
    const {
        searchTerm,
        results,
        selectedStudent,
        loading,
        handleKeyPress,
        handleSelectStudent,
        handleBackToSearch
    } = useKioskController();

    return (
        <div className="layout-wrapper vh-100 d-flex flex-column overflow-hidden bg-light font-size-16">
            {/* Header / Top Bar - Styled like Main App Header */}
            <div className="d-flex justify-content-between align-items-center bg-white shadow-sm" style={{ zIndex: 10, padding: '0px 15px', height: '80px' }}>
                <div className="d-flex align-items-center h-100">
                    <div className="d-flex align-items-center justify-content-center me-3 h-100">
                        <img src={logoIcon} alt="" style={{ maxHeight: '120px', width: 'auto' }} />
                    </div>
                </div>
                <div className="text-end">
                    <span className="badge bg-soft-primary text-primary font-size-14 p-2 rounded-pill">
                        {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow-1 d-flex flex-column position-relative overflow-hidden">
                <Container fluid className="h-100 p-0 d-flex flex-column">

                    {selectedStudent ? (
                        <div className="p-4 flex-grow-1 overflow-auto">
                            <EvaluationResults
                                student={selectedStudent}
                                onBack={handleBackToSearch}
                            />
                        </div>
                    ) : (
                        <div className="d-flex flex-column h-100">
                            {/* Input & Results Area - Scrollable */}
                            <div className="flex-grow-1 overflow-auto p-4" style={{ paddingBottom: '320px' }}>
                                <div className="d-flex flex-column align-items-center pt-5">

                                    {!results.length && !searchTerm && (
                                        <div className="mb-4 text-center opacity-50">
                                            <i className="mdi mdi-account-search display-2 text-primary"></i>
                                            <h4 className="mt-2 text-muted fw-normal">Bem-vindo</h4>
                                        </div>
                                    )}

                                    <StudentSearch
                                        searchTerm={searchTerm}
                                        onSelect={handleSelectStudent}
                                        results={results}
                                        loading={loading}
                                    />
                                </div>
                            </div>

                            {/* Virtual Keyboard Global Fixed Container */}
                            <div className="position-absolute bottom-0 start-0 w-100" style={{ zIndex: 100 }}>
                                <VirtualKeyboard onKeyPress={handleKeyPress} />
                            </div>
                        </div>
                    )}
                </Container>
            </div>

            <style>{`
                .page-content {
                    font-family: 'Inter', sans-serif;
                }
                /* Custom Scrollbar for touch friendliness */
                ::-webkit-scrollbar {
                    width: 6px;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.1);
                    border-radius: 3px;
                }
            `}</style>
        </div>
    );
};

export default Kiosk;
