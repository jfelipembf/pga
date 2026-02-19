
import React from 'react';
import { Container } from 'reactstrap';
import ClientsSearch from './components/ClientsSearch';
import VirtualKeyboard from './components/VirtualKeyboard';
import EvaluationResults from './components/EvaluationResults';
import FaceScanner from './components/FaceScanner';

import { useKioskController } from './hooks/useKioskController';
import logoIcon from "../../assets/images/logoIcon.png"

/**
 * Kiosk Main Page
 * Optimized for touch devices, vertical layout.
 * A câmera fica sempre ativa escaneando rostos automaticamente.
 */
const Kiosk = () => {
    // Feature Flag para Identificação Facial (Desativado por hora)
    const SHOW_FACE_ID_SCANNER = false;

    const {
        searchTerm,
        results,
        selectedClient,
        loading,
        faceScanning,
        faceMatching,
        handleFaceDetected,
        handleKeyPress,
        handleSelectClient,
        handleBackToSearch
    } = useKioskController();

    return (
        <div className="layout-wrapper vh-100 d-flex flex-column overflow-hidden bg-light font-size-16">
            {/* Header / Top Bar */}
            <div className="d-flex justify-content-between align-items-center bg-white shadow-sm" style={{ zIndex: 10, padding: '0px 15px', height: '80px' }}>
                <div className="d-flex align-items-center h-100">
                    <div className="d-flex align-items-center justify-content-center me-3 h-100">
                        <img src={logoIcon} alt="" style={{ maxHeight: '120px', width: 'auto' }} />
                    </div>
                </div>
                <div className="text-end d-flex align-items-center gap-3">
                    {SHOW_FACE_ID_SCANNER && faceMatching && (
                        <span className="badge bg-soft-warning text-warning font-size-13 p-2 rounded-pill">
                            <i className="mdi mdi-face-recognition me-1" />
                            Identificando...
                        </span>
                    )}
                    <span className="badge bg-soft-primary text-primary font-size-14 p-2 rounded-pill">
                        {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow-1 d-flex flex-column position-relative overflow-hidden">
                <Container fluid className="h-100 p-0 d-flex flex-column">

                    {selectedClient ? (
                        <div className="p-4 flex-grow-1 overflow-auto">
                            <EvaluationResults
                                client={selectedClient}
                                onBack={handleBackToSearch}
                            />
                        </div>
                    ) : (
                        <div className="d-flex flex-column h-100">
                            {/* Input & Results Area - Scrollable */}
                            <div className="flex-grow-1 overflow-auto p-4" style={{ paddingBottom: '320px' }}>
                                <div className="d-flex flex-column align-items-center pt-3">

                                    {SHOW_FACE_ID_SCANNER && (
                                        <>
                                            {/* Face Scanner */}
                                            <div className="mb-4">
                                                <FaceScanner
                                                    onFaceDetected={handleFaceDetected}
                                                    enabled={faceScanning && !loading}
                                                    scanInterval={2500}
                                                />
                                            </div>

                                            {/* Separador */}
                                            <div className="d-flex align-items-center w-100 mb-3" style={{ maxWidth: '600px' }}>
                                                <hr className="flex-grow-1 m-0" />
                                                <span className="text-muted px-3 font-size-13">ou busque pelo nome</span>
                                                <hr className="flex-grow-1 m-0" />
                                            </div>
                                        </>
                                    )}

                                    {/* Busca por nome */}
                                    <div className="position-relative w-100 mt-4" style={{ maxWidth: '600px' }}>
                                        {!SHOW_FACE_ID_SCANNER && (
                                            <div className="text-center mb-4">
                                                <h4 className="text-muted fw-normal">Toque no teclado abaixo para começar</h4>
                                            </div>
                                        )}
                                        <ClientsSearch
                                            searchTerm={searchTerm}
                                            onSelect={handleSelectClient}
                                            results={results}
                                            loading={loading}
                                        />
                                    </div>
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
            `}
            </style>
        </div>
    );
};

export default Kiosk;
