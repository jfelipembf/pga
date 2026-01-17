import React from "react"
import { Card, CardBody, Input, Button, Badge } from "reactstrap"

const OperationalAlertCard = ({
    title,
    items = [],
    type, // 'tasks', 'birthday', 'expiration'
    onCheck,
    onAdd,
    dateSelector, // { value, onChange }
    isLoading = false
}) => {
    return (
        <Card style={{ minHeight: "500px" }} className="shadow-sm border-0 h-100">
            <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-2">
                        <h4 className="card-title mb-0">{title}</h4>
                        {dateSelector && (
                            <Input
                                type="date"
                                bsSize="sm"
                                value={dateSelector.value}
                                onChange={(e) => dateSelector.onChange(e.target.value)}
                                className="form-control-sm border-0 bg-light"
                                style={{ maxWidth: "120px", fontSize: '11px' }}
                            />
                        )}
                    </div>

                    {onAdd && (
                        <Button
                            color="primary"
                            size="sm"
                            className="rounded-circle p-0"
                            style={{ width: "22px", height: "22px" }}
                            onClick={onAdd}
                        >
                            <i className="mdi mdi-plus"></i>
                        </Button>
                    )}
                </div>

                <div className="custom-scroll" style={{ maxHeight: "400px", minHeight: "200px", overflowY: "auto" }}>
                    <ol className="activity-feed mb-0 ps-3">
                        {items.length === 0 ? (
                            <li className="text-muted small mt-2">Nada para exibir.</li>
                        ) : (
                            items.map((item) => (
                                <li key={item.id} className="feed-item">
                                    <div className="feed-item-list d-flex align-items-start gap-2">
                                        {onCheck && (
                                            <Input
                                                type="checkbox"
                                                checked={item.status === 'completed'}
                                                onChange={() => (item.status !== 'completed') ? onCheck(item) : null}
                                                style={{ marginTop: "2px", cursor: "pointer" }}
                                                disabled={item.status === 'completed'}
                                            />
                                        )}

                                        {type !== 'tasks' && item.photo && (
                                            <img
                                                src={item.photo}
                                                alt=""
                                                className="avatar-xs rounded-circle"
                                                style={{ objectFit: "cover", width: "32px", height: "32px", flexShrink: 0 }}
                                            />
                                        )}

                                        <div style={{ opacity: item.status === 'completed' ? 0.6 : 1, width: '100%' }}>
                                            <div className="d-flex justify-content-between">
                                                <span className="date mb-1">{item.dueDate || item.date || item.endDate}</span>
                                                {type === 'birthday' && (
                                                    <span>
                                                        {item.messageSent === true && <i className="mdi mdi-check-circle text-success" title="Mensagem Enviada"></i>}
                                                        {item.messageSent === false && <i className="mdi mdi-close-circle text-danger" title="Erro no Envio"></i>}
                                                        {item.messageSent === undefined && <i className="mdi mdi-clock-outline text-muted" title="Aguardando"></i>}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`activity-text fw-bold d-block text-dark ${item.status === 'completed' ? 'text-decoration-line-through' : ''}`}>
                                                {item.description || item.title || item.name}
                                            </span>
                                            <p className="text-muted small mb-0">{item.info || item.role || item.contractTitle || ""}</p>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ol>
                </div>
            </CardBody>
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
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
            `}</style>
        </Card>
    )
}

export default OperationalAlertCard
