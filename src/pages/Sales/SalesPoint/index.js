import React from 'react';
import { Row, Col, Button } from 'reactstrap';
import SalesSelectionPanel from './components/SalesSelectionPanel';
import SalesCartPanel from './components/SalesCartPanel';
import SalesReceiptModal from '../../../components/Common/SalesReceiptModal';
import { useNavigate } from 'react-router-dom';
import { useSalesPoint } from './hooks/useSalesPoint';
import OverlayLoader from '../../../components/Common/OverlayLoader';
import PageLoader from '../../../components/Common/PageLoader';

/**
 * Página de Ponto de Venda.
 * Segue o padrão de ser uma "View" limpa, delegando a lógica para o hook useSalesPoint.
 */
const SalesPoint = () => {
    const navigate = useNavigate();

    // Toda a lógica de estado e processamento extraída para o hook
    const {
        isReady,
        clientName,
        activeTab,
        cartItems,
        payments,
        isProcessing,
        isLoadingData,
        data,
        totals,
        toggleTab,
        handleAddItem,
        handleAddPayment,
        handleRemoveItem,
        handleRemovePayment,
        handleFinalizeSale,
        startDate, setStartDate,
        discount, setDiscount,
        isRenewal, setIsRenewal,
        saleDate, setSaleDate,
        showReceiptModal,
        saleSuccessData,
        handleCloseReceipt
    } = useSalesPoint();

    // 1. Prevenir renderização parcial antes do contexto estar pronto ou dados iniciais carregados
    // Isso elimina o "flicker" de renderizar o esqueleto vazio antes de ter os dados.
    if (!isReady || isLoadingData) {
        return <PageLoader isFixed={false} />;
    }

    return (
        <div style={{ position: 'relative', minHeight: '400px' }}>
            {/* Cabeçalho da Venda */}
            <div className="d-flex align-items-center justify-content-between px-4 py-3 bg-dark text-white mb-4 rounded shadow-sm">
                <div className="d-flex align-items-center">
                    <Button
                        color="link"
                        className="text-white p-0 me-3"
                        onClick={() => navigate(-1)}
                    >
                        <i className="mdi mdi-arrow-left font-size-22"></i>
                    </Button>
                    <div className="avatar-xs me-3">
                        <span className="avatar-title rounded-circle bg-light text-dark font-size-16">
                            {clientName.charAt(0)}
                        </span>
                    </div>
                    <h5 className="mb-0 text-white font-size-16 text-uppercase">{clientName}</h5>
                </div>

                <div className="d-flex align-items-center gap-4">
                    <div className="d-flex align-items-center">
                        <span className="badge rounded-pill bg-white text-dark font-size-12 me-2">1</span>
                        <span className="font-size-13 text-white">Venda em Aberto</span>
                    </div>
                    <div className="text-end">
                        <span className="d-block font-size-10 text-white-50">Total Final</span>
                        <h5 className="m-0 text-white font-size-16">
                            {totals?.total ? `R$ ${totals.total.toFixed(2)}` : 'R$ 0,00'}
                        </h5>
                    </div>
                </div>
            </div>

            <Row className="align-items-start g-3">
                {/* Painel de Seleção (Esquerda) */}
                <Col lg={8}>
                    <SalesSelectionPanel
                        activeTab={activeTab}
                        toggleTab={toggleTab}
                        onAddPayment={handleAddPayment}
                        onAddItem={handleAddItem}
                        contracts={data.contracts}
                        acquirers={data.acquirers}
                        suggestedValue={totals.balance > 0 ? totals.balance : 0}
                        startDate={startDate}
                        setStartDate={setStartDate}
                        isRenewal={isRenewal}
                        setIsRenewal={setIsRenewal}
                        discount={discount}
                        setDiscount={setDiscount}
                        saleDate={saleDate}
                        setSaleDate={setSaleDate}
                    />
                </Col>

                {/* Resumo da Venda (Direita) */}
                <Col lg={4}>
                    <SalesCartPanel
                        cartItems={cartItems}
                        payments={payments}
                        totals={totals}
                        onRemoveItem={handleRemoveItem}
                        onRemovePayment={handleRemovePayment}
                        onProceed={handleFinalizeSale}
                    />
                </Col>
            </Row>

            {/* Modal de Recibo - Deve vir antes dos loaders para não bugar z-index se loader fechar */}
            <SalesReceiptModal
                isOpen={showReceiptModal}
                toggle={handleCloseReceipt}
                saleData={saleSuccessData}
                clientName={clientName}
            />

            {/* Loading States - Usando zIndex alto para garantir cobertura */}
            <OverlayLoader show={isLoadingData} label="Carregando dados..." zIndex={1050} />
            <OverlayLoader show={isProcessing} label="Finalizando venda..." zIndex={1051} />
        </div>
    );
};

export default SalesPoint;
