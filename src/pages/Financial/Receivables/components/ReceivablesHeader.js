import React from 'react';
import { Button } from 'reactstrap';

export const ReceivablesHeader = ({ selectedIds = [], onAnticipate, clearSelection }) => {
    return (
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="font-size-18 text-uppercase fw-bold">Contas a Receber</h4>
            {selectedIds.length > 0 && (
                <div className="d-flex gap-2 animate__animated animate__fadeIn">
                    <Button
                        color="primary"
                        className="btn-md shadow-sm"
                        onClick={onAnticipate}
                    >
                        <i className="mdi mdi-flash me-1"></i> Antecipar {selectedIds.length} selecionados
                    </Button>
                    <Button
                        color="light"
                        className="btn-md border"
                        onClick={clearSelection}
                    >
                        Limpar Seleção
                    </Button>
                </div>
            )}
        </div>
    );
};
