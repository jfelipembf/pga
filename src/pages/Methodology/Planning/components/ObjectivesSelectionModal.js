import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, ListGroup, ListGroupItem, Badge } from 'reactstrap';

const ObjectivesSelectionModal = ({ isOpen, toggle, objectivesData, currentObjectives, onSave }) => {
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        if (isOpen && currentObjectives) {
            setSelectedIds(currentObjectives.map(o => o.id));
        } else {
            setSelectedIds([]);
        }
    }, [isOpen, currentObjectives]);

    const handleToggle = (obj) => {
        if (selectedIds.includes(obj.id)) {
            setSelectedIds(selectedIds.filter(id => id !== obj.id));
        } else {
            if (selectedIds.length >= 2) return; // Limite de 2
            setSelectedIds([...selectedIds, obj.id]);
        }
    };

    const handleSave = () => {
        const selectedObjects = objectivesData
            .filter(o => selectedIds.includes(o.id))
            .map((o, idx) => {
                // Tenta manter dados originais se já estava selecionado
                const original = currentObjectives?.find(c => c.id === o.id);
                if (original) return original;

                // Senão cria novo simples
                return {
                    id: o.id,
                    title: o.title,
                    gap: 0,
                    type: idx === 0 ? 'primary' : 'secondary',
                    reason: 'Selecionado Manualmente',
                    hasFundamental: o.topics?.some(t => t.isFundamental)
                };
            });

        onSave(selectedObjects);
        toggle();
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>Selecionar Objetivos</ModalHeader>
            <ModalBody>
                <p className="text-muted small mb-3">
                    Selecione até 2 objetivos para focar nesta aula.
                    Os objetivos selecionados definirão o planejamento.
                </p>
                <ListGroup flush>
                    {objectivesData && objectivesData.map(obj => (
                        <ListGroupItem
                            key={obj.id}
                            tag="button"
                            action
                            active={selectedIds.includes(obj.id)}
                            onClick={() => handleToggle(obj)}
                            className="d-flex justify-content-between align-items-center py-3"
                        >
                            <div className="text-start">
                                <h6 className="mb-0">{obj.title}</h6>
                                {obj.topics?.every(t => t.percentage >= 100) && <Badge color="success" className="me-1">Concluído</Badge>}
                                {obj.topics?.some(t => t.isFundamental) && <Badge color="warning" pill>Fundamental</Badge>}
                            </div>
                            {selectedIds.includes(obj.id) && <i className="mdi mdi-check-circle text-white font-size-18"></i>}
                        </ListGroupItem>
                    ))}
                </ListGroup>
            </ModalBody>
            <ModalFooter>
                <Button color="link" onClick={toggle}>Cancelar</Button>
                <Button color="primary" onClick={handleSave} disabled={selectedIds.length === 0}>
                    Salvar Planejamento
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ObjectivesSelectionModal;
