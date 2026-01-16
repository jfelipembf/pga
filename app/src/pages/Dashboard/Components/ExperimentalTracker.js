import React, { useState, useMemo } from "react";
import { Card, CardBody, Badge, Input } from "reactstrap";
import Spinner from "components/Common/Spinner"

const ExperimentalTracker = ({ experimentals = [], isLoading = false }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

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
            <Card style={{ height: "500px" }} className="shadow-sm border-0">
                <CardBody>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="card-title mb-0">Minhas Experimentais</h4>
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

                    <div className="custom-scroll" style={{ height: "410px", overflowY: "auto" }}>
                        {isLoading ? (
                            <div className="d-flex justify-content-center align-items-center h-100">
                                <Spinner />
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="text-center mt-5 text-muted">
                                <i className="mdi mdi-calendar-blank h1 d-block"></i>
                                <p>Nenhuma aula experimental agendada para {selectedDate === new Date().toLocaleDateString('en-CA') ? 'hoje' : 'esta data'}.</p>
                            </div>
                        ) : (
                            <ol className="activity-feed mb-0 ps-2">
                                {filteredData.map((item) => (
                                    <li key={item.id} className="feed-item pb-4">
                                        <div className="d-flex align-items-start gap-2">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="avatar-xs">
                                                    <span className="avatar-title rounded-circle bg-soft-primary text-primary fs-4">
                                                        <i className="mdi mdi-account-circle"></i>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 ms-2">
                                                <div className="d-flex flex-column">
                                                    <span className="date mb-0 text-primary fw-bold" style={{ fontSize: '11px' }}>{item.startTime || "--:--"}</span>
                                                    <h6 className="mb-0 font-size-14 fw-bold text-dark">{item.clientName || "Cliente"}</h6>
                                                    <p className="text-muted small mb-1">{item.activityName || item.className}</p>
                                                    <div>
                                                        <Badge
                                                            color={`soft-${getStatusColor(item.status)}`}
                                                            className={`text-${getStatusColor(item.status)} border`}
                                                            style={{ fontSize: '10px' }}
                                                        >
                                                            {item.status === 'active' ? 'Agendado' : item.status}
                                                        </Badge>
                                                    </div>
                                                </div>
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
                    padding-left: 30px;
                    border-left: 2px solid #eff2f7;
                }
                .activity-feed .feed-item:last-child { border-left: none; }
                .activity-feed .feed-item:after {
                    content: "";
                    display: block;
                    position: absolute;
                    top: 15px;
                    left: -7px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #fff;
                    border: 2px solid #f1b44c;
                }
                .avatar-xs { height: 38px; width: 38px; }
                .avatar-title { align-items: center; display: flex; height: 100%; justify-content: center; width: 100%; }
                .bg-soft-primary { background-color: rgba(59, 93, 231, 0.1); }
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
            `}</style>
        </React.Fragment>
    );
};

export default ExperimentalTracker;