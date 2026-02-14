import React from 'react';
import { Button } from 'reactstrap';

export const PayablesHeader = ({ onNewClick }) => {
    return (
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="font-size-18 text-uppercase fw-bold">Contas a Pagar</h4>
            <Button color="primary" className="waves-effect waves-light shadow-sm" onClick={onNewClick}>
                Nova Despesa
            </Button>
        </div>
    );
};
