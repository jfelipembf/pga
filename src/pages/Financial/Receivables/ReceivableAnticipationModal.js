import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Row, Col, Label, Input, Alert, Table } from 'reactstrap';
import ButtonLoader from '../../../components/Common/ButtonLoader';
import { formatCurrency } from '../../../utils/format';
import { bankAccountRepository } from '../../../data/repositories/BankAccountRepository';
import { useTenant } from '../../../hooks/useTenant';
import moment from 'moment';

const ReceivableAnticipationModal = ({ isOpen, toggle, selectedReceivables, onAnticipate }) => {
    const { idTenant, idBranch } = useTenant();
    const [bankAccounts, setBankAccounts] = useState([]);
    const [idBankAccount, setIdBankAccount] = useState('');
    const [anticipationFee, setAnticipationFee] = useState(3); // Taxa padrão de 3%
    const [loading, setLoading] = useState(false);

    // Carregar contas bancárias
    useEffect(() => {
        if (isOpen) {
            const loadAccounts = async () => {
                const accounts = await bankAccountRepository.findActive(idTenant, idBranch);
                setBankAccounts(accounts);
                if (accounts.length > 0) setIdBankAccount(accounts[0].id);
            };
            loadAccounts();
        }
    }, [isOpen, idTenant, idBranch]);

    if (!selectedReceivables || selectedReceivables.length === 0) return null;

    // Cálculos
    const totalGross = selectedReceivables.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const totalExtraFee = totalGross * (anticipationFee / 100);
    const totalNet = totalGross - totalExtraFee;

    const handleSubmit = async () => {
        if (!idBankAccount) return alert("Selecione uma conta bancária");

        setLoading(true);
        try {
            await onAnticipate({
                receivableIds: selectedReceivables.map(r => r.id),
                idBankAccount,
                anticipationFee,
                totalNet,
                totalGross,
                totalExtraFee,
                settlementDate: new Date().toISOString()
            });
            toggle();
        } catch (error) {
            console.error("Erro na antecipação:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle} className="bg-primary text-white">
                <i className="mdi mdi-flash me-2"></i> Antecipação de Recebíveis
            </ModalHeader>
            <ModalBody className="p-4">
                <Alert color="info" className="border-0 shadow-sm mb-4">
                    <h6 className="fw-bold mb-1">Como funciona a Antecipação?</h6>
                    <small>
                        As parcelas selecionadas serão liquidadas com a data de hoje. Uma taxa adicional será aplicada sobre o valor bruto e o valor líquido será depositado na conta selecionada.
                    </small>
                </Alert>

                <Row className="mb-4 g-3">
                    <Col md={4}>
                        <div className="p-3 border rounded bg-light">
                            <Label className="font-size-11 text-muted text-uppercase fw-bold">Total Bruto</Label>
                            <h4 className="mb-0 text-dark">{formatCurrency(totalGross)}</h4>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="p-3 border rounded bg-danger-subtle">
                            <Label className="font-size-11 text-danger text-uppercase fw-bold">Taxa Antecipação (%)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={anticipationFee}
                                onChange={(e) => setAnticipationFee(parseFloat(e.target.value) || 0)}
                                className="form-control-sm border-danger"
                            />
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="p-3 border rounded bg-success text-white">
                            <Label className="font-size-11 text-white-50 text-uppercase fw-bold">Líquido a Receber</Label>
                            <h4 className="mb-0">{formatCurrency(totalNet)}</h4>
                        </div>
                    </Col>
                </Row>

                <div className="mb-4">
                    <Label className="fw-bold">Conta Bancária de Destino</Label>
                    <Input
                        type="select"
                        value={idBankAccount}
                        onChange={(e) => setIdBankAccount(e.target.value)}
                    >
                        <option value="">Selecione a conta...</option>
                        {bankAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </Input>
                </div>

                <div className="table-responsive border rounded mb-4" style={{ maxHeight: '200px' }}>
                    <Table size="sm" className="mb-0">
                        <thead className="table-light sticky-top">
                            <tr>
                                <th>Cliente</th>
                                <th>Vencto Original</th>
                                <th className="text-end">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedReceivables.map(r => (
                                <tr key={r.id}>
                                    <td className="font-size-12">{r.clientName}</td>
                                    <td className="font-size-12">{moment(r.dueDate).format('DD/MM/YYYY')}</td>
                                    <td className="text-end font-size-12 fw-bold">{formatCurrency(r.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                <div className="d-flex justify-content-end gap-2">
                    <Button color="light" onClick={toggle} disabled={loading}>Cancelar</Button>
                    <ButtonLoader
                        color="primary"
                        className="px-4 fw-bold shadow-sm"
                        onClick={handleSubmit}
                        disabled={loading || !idBankAccount}
                        loading={loading}
                        loadingText="Processando..."
                    >
                        CONFIRMAR ANTECIPAÇÃO DE {formatCurrency(totalNet)}
                    </ButtonLoader>
                </div>
            </ModalBody>
        </Modal>
    );
};

export default ReceivableAnticipationModal;
