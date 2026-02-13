
import React, { useRef, useEffect, useState } from 'react';
import { Modal, ModalBody, Button } from 'reactstrap';
import { useReactToPrint } from 'react-to-print';
import moment from 'moment';
import { useTenant } from '../../hooks/useTenant';
import CompanyService from '../../services/Company/CompanyService';

const SalesReceiptModal = ({ isOpen, toggle, saleData, clientName }) => {
    const componentRef = useRef();
    const { idTenant } = useTenant();
    const [company, setCompany] = useState(null);

    useEffect(() => {
        const fetchCompany = async () => {
            if (idTenant && isOpen) {
                try {
                    const data = await CompanyService.getCompanyData(idTenant);
                    setCompany(data);
                } catch (err) {
                    console.error("Error loading company data for receipt", err);
                }
            }
        };
        fetchCompany();
    }, [idTenant, isOpen]);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Recibo_Venda_${saleData?.saleNumber || 'Nova'} `,
        onAfterPrint: toggle
    });

    if (!saleData) return null;

    return (
        <Modal
            isOpen={isOpen}
            toggle={toggle}
            centered
            contentClassName="bg-transparent border-0 shadow-none"
            style={{ maxWidth: 'min-content' }} // Ajusta largura ao conteúdo
        >
            <ModalBody className="p-0 text-center">
                {/* Recibo */}
                <div
                    ref={componentRef}
                    className="bg-white p-4 mx-auto shadow-lg"
                    style={{
                        width: '80mm', // Fixa largura do papel
                        fontFamily: '"Courier New", Courier, monospace',
                        fontSize: '12px',
                        color: '#000',
                        minHeight: '300px'
                    }}
                >
                    {/* Botão de fechar (X) discreto no topo do recibo ou fora? 
                        Melhor deixar limpo para impressão e usar botão abaixo.
                    */}

                    {/* Cabeçalho */}
                    <div className="text-center mb-3">
                        {company?.logo && (
                            <div className="mb-2">
                                <img
                                    src={company.logo}
                                    alt="Logo"
                                    style={{
                                        maxWidth: '60px',
                                        maxHeight: '60px',
                                        objectFit: 'contain',
                                        filter: 'grayscale(100%)' // Opcional: recibos térmicos costumam ser P/B, mas pode deixar colorido
                                    }}
                                />
                            </div>
                        )}
                        <h4 className="fw-bold mb-1" style={{ fontSize: '16px' }}>{company?.name || 'PGA SISTEMA'}</h4>
                        <p className="mb-0">
                            {company?.street ? `${company.street}, ${company.number || ''}` : 'Rua Exemplo, 123'}
                            {company?.neighborhood ? ` - ${company.neighborhood}` : ' - Centro'}
                        </p>
                        <p className="mb-0">
                            {company?.city ? `${company.city} - ${company.state}` : ''}
                        </p>
                        <p className="mb-0">Tel: {company?.phone || '(11) 99999-9999'}</p>
                        <div className="border-bottom border-dark my-2 w-100"></div>
                    </div>

                    {/* Dados da Venda */}
                    <div className="mb-3 text-start">
                        <p className="mb-1"><strong>Data:</strong> {moment(saleData.saleDate || new Date()).format('DD/MM/YYYY HH:mm')}</p>
                        <p className="mb-1"><strong>Venda Nº:</strong> {saleData.saleNumber || '---'}</p>
                        <p className="mb-1"><strong>Cliente:</strong> {clientName}</p>
                    </div>

                    <div className="border-bottom border-dark my-2 w-100"></div>

                    {/* Itens */}
                    <table className="w-100 mb-3" style={{ fontSize: '12px' }}>
                        <thead>
                            <tr className="text-start">
                                <th style={{ width: '60%' }}>Item</th>
                                <th className="text-end">R$</th>
                            </tr>
                        </thead>
                        <tbody>
                            {saleData.items?.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="text-start">
                                        {item.name}
                                        {item.type === 'contract' && <div className="small text-muted">Contrato</div>}
                                    </td>
                                    <td className="text-end">{parseFloat(item.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-bottom border-dashed border-dark my-2 w-100"></div>

                    {/* Totais */}
                    <div className="d-flex justify-content-between">
                        <span>Subtotal:</span>
                        <span>R$ {saleData.subtotal?.toFixed(2)}</span>
                    </div>
                    {saleData.discount > 0 && (
                        <div className="d-flex justify-content-between">
                            <span>Desconto:</span>
                            <span>- R$ {parseFloat(saleData.discount).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="d-flex justify-content-between fw-bold mt-1" style={{ fontSize: '14px' }}>
                        <span>TOTAL:</span>
                        <span>R$ {parseFloat(saleData.total).toFixed(2)}</span>
                    </div>

                    <div className="border-bottom border-dark my-2 w-100"></div>

                    {/* Pagamento */}
                    <div className="mb-3 text-start">
                        <strong>Forma de Pagamento:</strong>
                        {saleData.payments?.map((pay, idx) => (
                            <div key={idx} className="d-flex justify-content-between small">
                                <span>{pay.methodLabel} {pay.installments > 1 ? `(${pay.installments}x)` : ''}</span>
                                <span>R$ {parseFloat(pay.value).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-bottom border-dark my-2 w-100"></div>

                    {/* Rodapé */}
                    <div className="text-center mt-4">
                        <p className="mb-1">Obrigado pela preferência!</p>
                        <p className="small">Volte sempre.</p>
                    </div>
                </div>

                {/* Botões de Ação Abaixo do Recibo */}
                <div className="mt-4 d-flex justify-content-center gap-2">
                    <Button color="light" className="text-white bg-transparent border-white" onClick={toggle}>
                        Fechar
                    </Button>
                    <Button color="success" className="px-4" onClick={handlePrint}>
                        <i className="mdi mdi-printer me-1"></i> Imprimir
                    </Button>
                </div>
            </ModalBody>
        </Modal>
    );
};

export default SalesReceiptModal;
