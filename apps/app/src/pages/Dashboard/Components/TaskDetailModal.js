import React, { useState } from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, FormGroup, Label, Badge } from "reactstrap"
import StatusBadge from "../../../components/Common/StatusBadge"
import { updateTaskStatus, completeTask } from "../../../services/Tasks/tasks.service"
import { useToast } from "../../../components/Common/ToastProvider"

const TaskDetailModal = ({ isOpen, toggle, task, onTaskUpdated }) => {
    const [observations, setObservations] = useState(task?.observations || "")
    const [isProcessing, setIsProcessing] = useState(false)
    const toast = useToast()

    if (!task) return null

    const handleStatusChange = async (newStatus) => {
        setIsProcessing(true)
        try {
            if (newStatus === 'completed') {
                await completeTask(task.id, observations) // Assumes completeTask function update
                toast.show({ title: "Sucesso", description: "Tarefa concluída!", color: "success" })
            } else {
                await updateTaskStatus(task.id, newStatus, observations)
                toast.show({ title: "Atualizado", description: `Status alterado para ${newStatus}`, color: "success" })
            }
            onTaskUpdated()
            toggle()
        } catch (error) {
            console.error("Erro ao atualizar tarefa", error)
            toast.show({ title: "Erro", description: "Falha ao atualizar tarefa", color: "danger" })
        } finally {
            setIsProcessing(false)
        }
    }

    const isReadOnly = task.status === 'completed' || task.status === 'canceled'

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle}>Detalhes da Tarefa</ModalHeader>
            <ModalBody>
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <h5 className="mb-2 text-primary d-flex align-items-center">
                            {task.clientName ? (
                                <>
                                    {task.clientPhoto ? (
                                        <img
                                            src={task.clientPhoto}
                                            alt={task.clientName}
                                            className="rounded-circle avatar-xs me-2"
                                            style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <i className="mdi mdi-account-circle me-1 fs-4"></i>
                                    )}
                                    <span className="fw-bold">{task.clientName}</span>
                                </>
                            ) : (
                                "Tarefa Geral"
                            )}
                        </h5>

                        <div className="d-flex align-items-center text-muted small mt-1">
                            <span className="me-1">Criado por:</span>
                            {task.createdByName ? (
                                <div className="d-flex align-items-center">
                                    {task.createdByPhoto && (
                                        <img
                                            src={task.createdByPhoto}
                                            alt={task.createdByName}
                                            className="rounded-circle avatar-xs me-1"
                                            style={{ width: '20px', height: '20px', objectFit: 'cover' }}
                                        />
                                    )}
                                    <span className="fw-medium text-dark">{task.createdByName}</span>
                                </div>
                            ) : (
                                <span className="fst-italic">Sistema</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <StatusBadge status={task.status} type="task" />
                    </div>
                </div>

                <div className="p-3 bg-light rounded border mb-4">
                    <h6 className="fw-bold mb-2">Descrição</h6>
                    <p className="mb-0 fs-5">{task.description}</p>
                </div>

                <div className="row mb-4">
                    <div className="col-md-6">
                        <small className="text-muted d-block uppercase fw-bold">Prazo</small>
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                    {task.recurrenceTemplateId && (
                        <div className="col-md-6">
                            <small className="text-muted d-block uppercase fw-bold">Recorrência</small>
                            <Badge color="info" className="me-1">Recorrente</Badge>
                        </div>
                    )}
                </div>

                <FormGroup>
                    <Label className="fw-bold">Observações / Resolução</Label>
                    <Input
                        type="textarea"
                        rows="4"
                        placeholder={isReadOnly ? "Nenhuma observação registrada." : "Adicione detalhes sobre a execução..."}
                        value={observations}
                        onChange={e => setObservations(e.target.value)}
                        disabled={isReadOnly || isProcessing}
                    />
                </FormGroup>

            </ModalBody>
            <ModalFooter className="justify-content-between">
                {/* Left side actions (Cancel) */}
                <div>
                    {!isReadOnly && (
                        <Button
                            color="danger"
                            outline
                            size="sm"
                            onClick={() => {
                                if (window.confirm("Tem certeza que deseja cancelar esta tarefa?")) {
                                    handleStatusChange('canceled')
                                }
                            }}
                            disabled={isProcessing}
                        >
                            Cancelar Tarefa
                        </Button>
                    )}
                </div>

                {/* Right side actions (Progress) */}
                <div className="d-flex gap-2">
                    <Button color="secondary" onClick={toggle} disabled={isProcessing}>Fechar</Button>

                    {!isReadOnly && task.status === 'pending' && (
                        <Button
                            color="primary"
                            outline
                            onClick={() => handleStatusChange('in_progress')}
                            disabled={isProcessing}
                        >
                            Iniciar Execução
                        </Button>
                    )}

                    {!isReadOnly && (
                        <Button
                            color="success"
                            onClick={() => handleStatusChange('completed')}
                            disabled={isProcessing}
                        >
                            <i className="mdi mdi-check me-1"></i>
                            Concluir Tarefa
                        </Button>
                    )}
                </div>
            </ModalFooter>
        </Modal>
    )
}

export default TaskDetailModal
