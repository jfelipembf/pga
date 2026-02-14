import React, { useMemo } from 'react';
import BasicTable from "../../../../components/Common/BasicTable";
import { formatCurrency } from "../../../../utils/format";
import { formatDate } from "../../../../utils/date";
import { PAYMENT_METHOD_LABELS } from "../../../../utils/constants";
import { Row, Col } from 'reactstrap';

export const CashFlowTable = ({
    data,
    loading,
    hasMore,
    lastElementRef
}) => {

    const columns = useMemo(() => [
        {
            label: "Data",
            key: "date",
            render: (tx) => formatDate(tx.date)
        },
        {
            label: "Descrição",
            key: "description",
            render: (tx) => <span className="fw-semibold">{tx.description}</span>
        },
        {
            label: "Categoria",
            key: "category",
            render: (tx) => <span className="text-capitalize">{tx.category || 'Geral'}</span>
        },
        {
            label: "Método",
            key: "method",
            render: (tx) => (
                <span className="text-uppercase">
                    {PAYMENT_METHOD_LABELS[tx.method] || tx.method || '-'}
                </span>
            )
        },
        {
            label: "Valor",
            key: "amount",
            render: (tx) => (
                <div className={`text-end fw-bold ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                </div>
            )
        }
    ], []);

    return (
        <Row>
            <Col lg={12}>
                <h5 className="font-size-14 mb-3 text-uppercase fw-bold text-muted">Últimos Lançamentos</h5>
                <BasicTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    searchKeys={["description", "category", "method"]}
                    searchPlaceholder="Buscar lançamentos..."
                    hideNew={true}
                    paginationPosition="hidden"
                    defaultPageSize={5000} // Mostra tudo carregado (já que infinite scroll)
                />

                {/* Infinite Scroll Sentinel */}
                {hasMore && (
                    <div ref={lastElementRef} className="text-center p-3">
                        {loading && (
                            <div>
                                <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                <small className="text-muted">Carregando mais...</small>
                            </div>
                        )}
                    </div>
                )}
            </Col>
        </Row>
    );
};
