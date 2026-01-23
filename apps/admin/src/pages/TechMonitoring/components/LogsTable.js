import React from "react"
import { Card, CardBody, Table, CardTitle, Badge } from "reactstrap"

const statusColor = (status, duration) => {
    if (status === 'ERROR') return 'danger';
    if (duration > 3000) return 'danger';
    if (duration > 1000) return 'warning';
    return 'success';
}

const LogsTable = ({ logs, loading }) => {
    return (
        <Card>
            <CardBody>
                <CardTitle className="mb-4">Logs Recentes</CardTitle>
                <div className="table-responsive">
                    <Table className="table-nowrap table-hover mb-0 align-middle">
                        <thead>
                            <tr>
                                <th>Função</th>
                                <th>Status</th>
                                <th>Duração</th>
                                <th>Data/Hora</th>
                                <th>Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center">Carregando logs...</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <h5 className="font-size-14 mb-1">{log.functionName}</h5>
                                        <div className="text-muted font-size-12">{log.context?.trigger}</div>
                                    </td>
                                    <td>
                                        <Badge color={statusColor(log.status, log.duration)} className="font-size-12">
                                            {log.status === 'OK' && log.duration > 2000 ? 'SLOW' : log.status}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div style={{ width: "100px", height: "6px", backgroundColor: "#eee", borderRadius: "3px", overflow: "hidden" }}>
                                            <div
                                                style={{
                                                    width: `${Math.min((log.duration / 5000) * 100, 100)}%`,
                                                    backgroundColor: statusColor(log.status, log.duration) === 'danger' ? '#f46a6a' :
                                                        statusColor(log.status, log.duration) === 'warning' ? '#f1b44c' : '#34c38f',
                                                    height: "100%"
                                                }}
                                            />
                                        </div>
                                        <small className="text-muted">{log.duration}ms</small>
                                    </td>
                                    <td>
                                        {log.date.toLocaleString('pt-BR')}
                                    </td>
                                    <td>
                                        {log.metadata?._perf ? (
                                            <div className="font-size-11">
                                                {Object.entries(log.metadata._perf).map(([key, val]) => (
                                                    <div key={key} className={key === 'total' ? 'fw-bold mt-1' : 'text-muted'}>
                                                        {key}: <span className="text-dark">{val}ms</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <pre style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                                                {JSON.stringify(log.metadata || {}, null, 0)}
                                            </pre>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </CardBody>
        </Card>
    )
}

export default LogsTable
