import React, { useState } from 'react';
import { Card, CardBody, Badge, Spinner } from 'reactstrap';
import moment from 'moment';
import { useTasks } from '../hooks/useTasks';
import TaskModal from './TaskModal';



const TaskSummaryList = ({ title = "Minhas Tarefas de Hoje", filters = {} }) => {
    const { tasks, loading, completeTask, refresh } = useTasks(filters);
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

    // Agrupar tarefas por categoria
    const tasksByCategory = {
        other: [],
        sales: [],
        support: [],
        admin: [],
        meeting: [],
        trial: []
    };

    tasks.forEach(task => {
        const cat = task.category || 'other';
        if (tasksByCategory[cat]) {
            tasksByCategory[cat].push(task);
        } else {
            tasksByCategory['other'].push(task);
        }
    });

    // Incremental loading: Card structure appears first
    const categories = [
        { key: 'trial', label: 'Experimental', color: 'danger' },
        { key: 'other', label: 'Geral', color: 'secondary' },
        { key: 'sales', label: 'Vendas', color: 'success' },
        { key: 'support', label: 'Suporte', color: 'info' },
        { key: 'admin', label: 'Adm', color: 'primary' },
        { key: 'meeting', label: 'Reunião', color: 'warning' }
    ];

    return (
        <Card className="shadow-sm border-0 h-100">
            <CardBody>
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center">
                        <div className="avatar-sm me-3">
                            <span className="avatar-title rounded-circle bg-primary bg-opacity-10 text-primary">
                                <i className="mdi mdi-format-list-checks font-size-24"></i>
                            </span>
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h5 className="mb-1">{title}</h5>
                                {loading && <Spinner size="sm" color="primary" className="ms-1" />}
                            </div>
                            <p className="text-muted mb-0 small">Gestão de atividades e alunos</p>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm px-3 shadow-sm" onClick={toggleModal}>
                        <i className="mdi mdi-plus me-1"></i>
                        Nova Tarefa
                    </button>
                </div>

                <div className="row">
                    {categories.map(cat => (
                        <div key={cat.key} className="col-12 col-md-4 col-lg border-end last-border-0">
                            <h6 className={`text-uppercase text-${cat.color} font-size-12 fw-bold mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center`}>
                                {cat.label}
                                <Badge color={cat.color} pill className="ms-2">
                                    {loading ? "..." : (tasksByCategory[cat.key]?.length || 0)}
                                </Badge>
                            </h6>

                            <div className="task-column">
                                {loading ? (
                                    <div className="text-center py-4 opacity-25">
                                        <i className="mdi mdi-loading mdi-spin font-size-18"></i>
                                    </div>
                                ) : tasksByCategory[cat.key]?.length > 0 ? (
                                    tasksByCategory[cat.key].map(task => (
                                        <div key={task.id}
                                            className="card mb-3 border shadow-none task-card"
                                            style={{ borderLeft: `4px solid var(--bs-${cat.color})` }}
                                        >
                                            <div className="card-body p-3">
                                                <div className="d-flex align-items-start">
                                                    <div
                                                        className="form-check me-2 mt-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (task.category !== 'trial') {
                                                                completeTask(task.id, task.status === 'completed' ? 'pending' : 'completed');
                                                            }
                                                        }}
                                                        style={{ visibility: task.category === 'trial' ? 'hidden' : 'visible' }}
                                                    >
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={task.status === 'completed'}
                                                            onChange={() => { }}
                                                            style={{ cursor: 'pointer' }}
                                                            disabled={task.category === 'trial'}
                                                        />
                                                    </div>
                                                    <div className="flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => handleEditTask(task)}>
                                                        <h6 className={`font-size-13 mb-1 ${task.status === 'completed' ? 'text-decoration-line-through opacity-50' : 'text-dark'}`}>
                                                            {task.title}
                                                        </h6>
                                                        <p className="text-muted font-size-11 mb-2" style={{ lineHeight: '1.2' }}>
                                                            {task.description?.substring(0, 50)}{task.description?.length > 50 ? '...' : ''}
                                                        </p>

                                                        {/* Avatars Only for compact view */}
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div className="avatar-group">
                                                                {task.assignedStaffDetails?.map((staff) => (
                                                                    <div key={staff.id} className="avatar-group-item">
                                                                        {staff.photo ? (
                                                                            <img src={staff.photo} alt="" className="rounded-circle avatar-xs" style={{ width: '20px', height: '20px' }} />
                                                                        ) : (
                                                                            <div className="avatar-xs" style={{ width: '20px', height: '20px' }}>
                                                                                <span className="avatar-title rounded-circle bg-soft-primary text-primary font-size-10">
                                                                                    {staff.name?.charAt(0)}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {task.dueDate && (
                                                                <small className={`font-size-10 ${moment(task.dueDate?.toDate ? task.dueDate.toDate() : task.dueDate).isBefore(moment(), 'day') ? 'text-danger fw-bold' : 'text-muted'}`}>
                                                                    {moment(task.dueDate?.toDate ? task.dueDate.toDate() : task.dueDate).format('DD/MM')}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-muted bg-light rounded mt-2 opacity-50 border border-dashed">
                                        <small>Sem tarefas</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <TaskModal
                    isOpen={isModalOpen}
                    toggle={toggleModal}
                    task={selectedTask}
                    onSuccess={refresh}
                />
                <style>{`
                .last-border-0:last-child { border-right: 0 !important; }
                .task-card:hover { transform: translateY(-2px); box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; transition: all 0.2s; }
                .avatar-group-item { margin-left: -5px; }
            `}</style>
            </CardBody>
        </Card>
    );
};

export default TaskSummaryList;
