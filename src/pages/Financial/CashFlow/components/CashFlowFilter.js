import React from 'react';
import { Button, Input } from 'reactstrap';
import Flatpickr from "react-flatpickr";
import { Portuguese } from "flatpickr/dist/l10n/pt.js";

export const CashFlowFilter = ({
    period, setPeriod,
    customDateRange, setCustomDateRange,
    bankAccounts,
    filterBankAccount, setFilterBankAccount
}) => {
    return (
        <div className="d-flex align-items-center flex-wrap gap-2">
            {/* Filtro de Conta */}
            <div style={{ minWidth: '200px' }}>
                <Input
                    type="select"
                    value={filterBankAccount}
                    onChange={(e) => setFilterBankAccount(e.target.value)}
                    className="shadow-sm"
                    style={{ height: '38px' }}
                >
                    <option value="all">Todas as Contas</option>
                    {bankAccounts?.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </Input>
            </div>

            <Button color={period === 'day' ? 'primary' : 'light'} className="shadow-sm" onClick={() => setPeriod('day')}>Hoje</Button>
            <Button color={period === 'week' ? 'primary' : 'light'} className="shadow-sm" onClick={() => setPeriod('week')}>Semana</Button>
            <Button color={period === 'month' ? 'primary' : 'light'} className="shadow-sm" onClick={() => setPeriod('month')}>Mês</Button>

            <Button color={period === 'custom' ? 'primary' : 'light'} className="shadow-sm" onClick={() => setPeriod('custom')} title="Personalizado">
                <i className="mdi mdi-calendar"></i>
            </Button>

            {period === 'custom' && (
                <div className="d-flex align-items-center gap-2 ms-2">
                    <div style={{ width: '130px' }}>
                        <Flatpickr
                            className="form-control"
                            value={customDateRange.start}
                            options={{
                                dateFormat: "d/m/Y",
                                locale: Portuguese,
                                maxDate: "today"
                            }}
                            onChange={(dates) => {
                                if (dates.length > 0) {
                                    setCustomDateRange(prev => ({ ...prev, start: dates[0] }))
                                }
                            }}
                            placeholder="Início"
                        />
                    </div>
                    <span className="text-muted fw-bold">-</span>
                    <div style={{ width: '130px' }}>
                        <Flatpickr
                            className="form-control"
                            value={customDateRange.end}
                            options={{
                                dateFormat: "d/m/Y",
                                locale: Portuguese,
                                maxDate: "today",
                                minDate: customDateRange.start
                            }}
                            onChange={(dates) => {
                                if (dates.length > 0) {
                                    setCustomDateRange(prev => ({ ...prev, end: dates[0] }))
                                }
                            }}
                            placeholder="Fim"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
