import React, { useState } from 'react';
import { Card, CardBody, Button, Badge, Input, Table } from 'reactstrap';
import { useTasks } from '../hooks/useTasks';
import TaskModal from './TaskModal';

const TaskDashboard = () => {
    const { tasks, loading, completeTask, refresh } = useTasks();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        if (!isModalOpen) setSelectedTask(null);
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const getPriorityBadge = (priority) => {
        const colors = { high: 'danger', medium: 'warning', low: 'info' };
        const labels = { high: 'Alta', medium: 'Média', low: 'Baixa' };
        return <Badge color={colors[priority]}>{labels[priority]}</Badge>;
    };

    return (
        <Card>
            <CardBody>
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <h4 className="card-title mb-0">Tarefas do Dia</h4>
                    <Button color="primary" onClick={toggleModal}>
                        <i className="mdi mdi-plus me-1"></i> Nova Tarefa
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="mdi mdi-checkbox-marked-circle-outline display-4 text-success mb-3"></i>
                        <h5 className="text-muted">Tudo em dia! Nenhuma tarefa para hoje.</h5>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table className="table-nowrap align-middle table-hover mb-0">
                            <thead>
                                <tr>
                                    <th style={{ width: "40px" }}></th>
                                    <th>Tarefa</th>
                                    <th>Responsável</th>
                                    <th>Prioridade</th>
                                    <th>Status</th>
                                    <th className="text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task.id} className={task.status === 'completed' ? 'opacity-50' : ''}>
                                        <td>
                                            <div className="form-check font-size-16">
                                                <Input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={task.status === 'completed'}
                                                    onChange={() => completeTask(task.id)}
                                                    id={`task-check-${task.id}`}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div
                                                className="fw-bold text-dark cursor-pointer"
                                                onClick={() => handleEditTask(task)}
                                                style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}
                                            >
                                                {task.title}
                                                {task.isRecurring && <i className="mdi mdi-repeat ms-1 text-primary" title="Tarefa Recorrente"></i>}
                                                {task.attachments?.length > 0 && <i className="mdi mdi-paperclip ms-1 text-muted"></i>}
                                            </div>
                                            <small className="text-muted d-block">{task.description?.substring(0, 50)}...</small>
                                        </td>
                                        <td>{task.assignedToName}</td>
                                        <td>{getPriorityBadge(task.priority)}</td>
                                        <td>
                                            <Badge color={task.status === 'completed' ? 'success' : 'light'} pill>
                                                {task.status === 'completed' ? 'Concluída' : 'Pendente'}
                                            </Badge>
                                        </td>
                                        <td className="text-end">
                                            <Button
                                                color="link"
                                                className="text-primary p-0 btn-sm"
                                                onClick={() => handleEditTask(task)}
                                            >
                                                <i className="mdi mdi-pencil font-size-18"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}

                <TaskModal
                    isOpen={isModalOpen}
                    toggle={toggleModal}
                    task={selectedTask}
                    onSuccess={refresh}
                />
            </CardBody>
        </Card>
    );
};

export default TaskDashboard;
