import React, { useState, useMemo } from "react";
import { Card, CardBody, Badge, Input } from "reactstrap";
import Spinner from "components/Common/Spinner"
import { getTodayISO } from "../../../utils/date"

const ExperimentalTracker = ({ experimentals = [], isLoading = false }) => {
    const [selectedDate, setSelectedDate] = useState(getTodayISO());

    const getStatusColor = (status) => {
        switch (status) {
            case "Confirmado": return "success";
            case "Aguardando": return "info";
            case "Realizada": return "success";
            default: return "warning";
        }
    };

    const filteredData = useMemo(() => {
        return experimentals.filter(item => item.sessionDate === selectedDate);
    }, [experimentals, selectedDate]);

    return (
        <React.Fragment>
            <Card style={{ minHeight: "500px" }} className="shadow-sm border-0 h-100">
                <CardBody>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="card-title mb-0">Atendimento / Exp.</h4>
                        <div style={{ width: '130px' }}>
                            <Input
                                type="date"
                                bsSize="sm"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="form-control-sm border-0 bg-light"
                                style={{ fontSize: '12px' }}
                            />
                        </div>
                    </div>

                    <div className="custom-scroll" style={{ maxHeight: "400px", minHeight: "200px", overflowY: "auto" }}>
                        {isLoading ? (
                            <div className="d-flex justify-content-center align-items-center h-100">
                                <Spinner />
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="text-center mt-5 text-muted">
                                <p className="small">Nenhuma aula experimental agendada.</p>
                            </div>
                        ) : (
                            <ol className="activity-feed mb-0 ps-3">
                                {filteredData.map((item) => (
                                    <li key={item.id} className="feed-item">
                                        <div className="feed-item-list d-flex align-items-start gap-2">
                                            <div className="flex-shrink-0">
                                                <div className="avatar-xs">
                                                    <span className="avatar-title rounded-circle bg-soft-primary text-primary">
                                                        <i className="mdi mdi-account-circle"></i>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1" style={{ width: '100%' }}>
                                                <div className="d-flex justify-content-between">
                                                    <span className="date mb-1">{item.startTime || "--:--"}</span>
                                                    <span>
                                                        <Badge
                                                            color={`soft-${getStatusColor(item.status)}`}
                                                            className={`text-${getStatusColor(item.status)} border`}
                                                            style={{ fontSize: '10px' }}
                                                        >
                                                            {item.status === 'active' ? 'Agendado' : item.status}
                                                        </Badge>
                                                    </span>
                                                </div>
                                                <span className="activity-text fw-bold d-block text-dark">
                                                    {item.clientName || "Cliente"}
                                                </span>
                                                <p className="text-muted small mb-0">{item.activityName || item.className}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </CardBody>
            </Card>

            <style>{`
                .activity-feed { list-style: none; }
                .activity-feed .feed-item {
                    position: relative;
                    padding-bottom: 25px;
                    padding-left: 20px;
                    border-left: 2px solid #eff2f7;
                }
                .activity-feed .feed-item:last-child { border-left: none; }
                .activity-feed .feed-item:after {
                    content: "";
                    display: block;
                    position: absolute;
                    top: 4px;
                    left: -7px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #fff;
                    border: 2px solid #3b5de7;
                }
                .activity-feed .feed-item .date {
                    display: block;
                    font-size: 11px;
                    color: #adb5bd;
                    text-transform: uppercase;
                    font-weight: 600;
                }
                .avatar-xs { height: 32px; width: 32px; flex-shrink: 0; }
                .avatar-title { align-items: center; display: flex; height: 100%; justify-content: center; width: 100%; font-size: 18px; }
                .bg-soft-primary { background-color: rgba(59, 93, 231, 0.1); }
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
            `}</style>
        </React.Fragment>
    );
};

export default ExperimentalTracker;