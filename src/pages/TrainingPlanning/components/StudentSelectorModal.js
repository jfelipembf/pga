
import React, { useState, useMemo } from 'react';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Input, ListGroup, ListGroupItem, Spinner
} from 'reactstrap';
import { useActiveClientsPool } from '../../Evaluation/Hooks/useActiveClientsPool';
import OverlayLoader from '../../../components/Common/OverlayLoader';

const StudentSelectorModal = ({ isOpen, toggle, onSend, workout }) => {
    const { clients: allClients } = useActiveClientsPool({ enabled: isOpen });
    const [searchText, setSearchText] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isSending, setIsSending] = useState(false);

    const filteredClients = useMemo(() => {
        const query = searchText.toLowerCase().trim();
        if (!query) return allClients.slice(0, 50); // Show first 50 by default
        return allClients.filter(c =>
            (c.name || "").toLowerCase().includes(query) ||
            (c.idGym || "").toLowerCase().includes(query)
        ).slice(0, 50);
    }, [allClients, searchText]);

    const toggleStudent = (id) => {
        const idStr = String(id);
        const next = new Set(selectedIds);
        if (next.has(idStr)) next.delete(idStr);
        else next.add(idStr);
        setSelectedIds(next);
    };

    const handleSend = async () => {
        if (selectedIds.size === 0) return;

        setIsSending(true);
        const selectedStudents = allClients.filter(c => selectedIds.has(String(c.id)));

        try {
            await onSend(selectedStudents);
            setSelectedIds(new Set());
            toggle();
        } catch (error) {
            console.error("Error sending training:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" className="modal-dialog-centered">
            <ModalHeader toggle={toggle} className="bg-light border-bottom">
                <div className="d-flex align-items-center">
                    <i className="mdi mdi-whatsapp text-success me-2 fs-3"></i>
                    <div>
                        <h5 className="modal-title mb-0">Enviar Treino via WhatsApp</h5>
                        <small className="text-muted">{workout?.description || 'Planejamento de Treino'}</small>
                    </div>
                </div>
            </ModalHeader>
            <ModalBody className="p-0 position-relative" style={{ minHeight: '400px', maxHeight: '600px', overflowY: 'hidden' }}>
                <OverlayLoader show={isSending} label="Enviando treinos..." />

                {/* Search Bar */}
                <div className="p-3 bg-white border-bottom sticky-top" style={{ zIndex: 10 }}>
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                            <i className="mdi mdi-magnify"></i>
                        </span>
                        <Input
                            type="text"
                            placeholder="Buscar aluno por nome ou matrícula..."
                            className="bg-light border-start-0"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>

                {/* Selected Count Bar */}
                {selectedIds.size > 0 && (
                    <div className="px-3 py-2 bg-primary bg-opacity-10 border-bottom d-flex justify-content-between align-items-center">
                        <span className="small text-primary fw-bold">
                            {selectedIds.size} {selectedIds.size === 1 ? 'aluno selecionado' : 'alunos selecionados'}
                        </span>
                        <Button color="link" size="sm" className="p-0 text-decoration-none" onClick={() => setSelectedIds(new Set())}>
                            Limpar Seleção
                        </Button>
                    </div>
                )}

                {/* Students List */}
                <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    <ListGroup flush>
                        {allClients.length === 0 ? (
                            <div className="text-center py-5">
                                <Spinner color="primary" size="sm" className="me-2" />
                                <span className="text-muted">Carregando lista de alunos...</span>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="mdi mdi-account-search-outline fs-1 text-muted opacity-50"></i>
                                <p className="text-muted">Nenhum aluno encontrado.</p>
                            </div>
                        ) : (
                            filteredClients.map(student => {
                                const isSelected = selectedIds.has(String(student.id));
                                return (
                                    <ListGroupItem
                                        key={student.id}
                                        className={`border-0 border-bottom py-3 px-4 d-flex align-items-center cursor-pointer transition-all ${isSelected ? 'bg-light' : ''}`}
                                        onClick={() => toggleStudent(student.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="me-3 position-relative">
                                            {student.photoUrl || student.photo ? (
                                                <img
                                                    src={student.photoUrl || student.photo}
                                                    alt={student.name}
                                                    className="rounded-circle border shadow-sm"
                                                    style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div
                                                    className="rounded-circle border shadow-sm bg-light d-flex align-items-center justify-content-center text-muted"
                                                    style={{ width: '45px', height: '45px' }}
                                                >
                                                    <i className="mdi mdi-account fs-3"></i>
                                                </div>
                                            )}
                                            {isSelected && (
                                                <div className="position-absolute bottom-0 end-0 bg-success rounded-circle d-flex align-items-center justify-content-center border border-white" style={{ width: '18px', height: '18px' }}>
                                                    <i className="mdi mdi-check text-white" style={{ fontSize: '12px' }}></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className={`mb-1 ${isSelected ? 'text-primary fw-bold' : 'text-dark fw-semibold'}`}>
                                                {student.name}
                                            </h6>
                                            <div className="d-flex align-items-center gap-2">
                                                {student.idGym && (
                                                    <span className="text-muted small fw-medium">
                                                        #{student.idGym}
                                                    </span>
                                                )}
                                                <span className="text-muted small">
                                                    <i className="mdi mdi-phone-outline me-1"></i>
                                                    {student.phone || student.cellPhone || student.responsavelPhone || 'Sem telefone'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ms-3">
                                            <Input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => { }} // Handled by ListGroupItem onClick
                                                className="form-check-input"
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            />
                                        </div>
                                    </ListGroupItem>
                                );
                            })
                        )}
                    </ListGroup>
                </div>
            </ModalBody>
            <ModalFooter className="bg-light">
                <Button color="secondary" outline onClick={toggle} disabled={isSending}>
                    Cancelar
                </Button>
                <Button
                    color="success"
                    className="px-4 shadow-sm"
                    disabled={selectedIds.size === 0 || isSending}
                    onClick={handleSend}
                >
                    <i className="mdi mdi-whatsapp me-2"></i>
                    Enviar para {selectedIds.size} {selectedIds.size === 1 ? 'aluno' : 'alunos'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default StudentSelectorModal;
